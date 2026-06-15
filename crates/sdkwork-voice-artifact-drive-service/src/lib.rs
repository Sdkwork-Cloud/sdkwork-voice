use async_trait::async_trait;
use sdkwork_drive_storage_contract::{DriveObjectLocator, DriveObjectStore, PutObjectRequest};
use sdkwork_drive_workspace_service::application::space_service::{
    CreateSpaceCommand, DriveSpaceService, ListSpacesCommand,
};
use sdkwork_drive_workspace_service::application::storage_key_service::{
    BuildStorageObjectKeyCommand, DriveStorageKeyService,
};
use sdkwork_drive_workspace_service::application::workspace_service::{
    DriveWorkspaceObjectRef, DriveWorkspaceService, EnsureDriveWorkspaceNode,
    EnsureDriveWorkspaceNodesCommand, ResolveDriveWorkspacePathCommand,
};
use sdkwork_drive_workspace_service::domain::space::DriveSpaceType;
use sdkwork_drive_workspace_service::ports::space_store::DriveSpaceStore;
use sdkwork_drive_workspace_service::ports::workspace_store::DriveWorkspaceStore;
use sdkwork_drive_workspace_service::uploader::{
    DriveUploadItem, DriveUploaderService, PrepareUploaderUploadCommand, UploaderActor,
    UploaderRetention, UploaderTarget,
};
use sdkwork_drive_workspace_service::{
    ports::uploader_store::DriveUploaderStore, DriveServiceError,
};
use sha2::{Digest, Sha256};

pub const VOICE_DRIVE_AI_GENERATED_SPACE_TYPE: &str = "ai_generated";
pub const VOICE_DRIVE_APP_ID: &str = "sdkwork-voice";
pub const VOICE_DRIVE_APP_RESOURCE_TYPE: &str = "voice_generation_task";
pub const VOICE_DRIVE_DEFAULT_CHUNK_SIZE_BYTES: i64 = 8 * 1024 * 1024;

#[derive(Clone, Debug, Eq, PartialEq)]
pub enum GeneratedArtifactActor {
    Anonymous { anonymous_id: String },
    User { user_id: String },
    System { operator_id: String },
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub enum VoiceGeneratedArtifactKind {
    Audio,
    Image,
    Music,
    SoundEffect,
    Transcript,
    Translation,
    Video,
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct VoiceGeneratedArtifact {
    pub artifact_id: String,
    pub provider_asset_id: Option<String>,
    pub kind: VoiceGeneratedArtifactKind,
    pub file_name: String,
    pub content_type: String,
    pub content_length: i64,
    pub checksum_sha256_hex: Option<String>,
    pub source_uri: String,
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct VoiceGeneratedArtifactBatch {
    pub tenant_id: String,
    pub organization_id: Option<String>,
    pub task_id: String,
    pub actor: GeneratedArtifactActor,
    pub provider_code: String,
    pub model: Option<String>,
    pub artifacts: Vec<VoiceGeneratedArtifact>,
    pub now_epoch_ms: i64,
}

#[derive(Clone, Debug)]
pub struct VoiceDriveUploadPlan {
    pub tenant_id: String,
    pub task_id: String,
    pub drive_space_type: &'static str,
    pub drive_space_id: String,
    pub owner_subject_type: &'static str,
    pub owner_subject_id: String,
    pub operator_id: String,
    pub uploads: Vec<VoiceDriveArtifactUploadPlan>,
}

#[derive(Clone, Debug)]
pub struct VoiceDriveArtifactUploadPlan {
    pub sync_no: String,
    pub artifact_id: String,
    pub artifact_index: usize,
    pub actor_type: String,
    pub user_id: Option<String>,
    pub anonymous_id: Option<String>,
    pub provider_asset_id: Option<String>,
    pub source_uri: String,
    pub logical_path: String,
    pub sync_status: &'static str,
    pub command: PrepareUploaderUploadCommand,
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub enum VoiceDrivePlanError {
    Validation(String),
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct VoiceDrivePersistenceResult {
    pub task_id: String,
    pub uploaded: Vec<VoiceDriveUploadedArtifact>,
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct VoiceDriveUploadedArtifact {
    pub sync_no: String,
    pub artifact_id: String,
    pub artifact_index: usize,
    pub drive_space_type: &'static str,
    pub drive_space_id: String,
    pub drive_node_id: String,
    pub drive_upload_item_id: String,
    pub drive_upload_session_id: Option<String>,
    pub sync_status: &'static str,
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct VoiceGeneratedArtifactBytes {
    pub artifact: VoiceGeneratedArtifact,
    pub bytes: Vec<u8>,
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct VoiceGeneratedArtifactBytesBatch {
    pub tenant_id: String,
    pub organization_id: Option<String>,
    pub task_id: String,
    pub actor: GeneratedArtifactActor,
    pub provider_code: String,
    pub model: Option<String>,
    pub artifacts: Vec<VoiceGeneratedArtifactBytes>,
    pub now_epoch_ms: i64,
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct VoiceDriveStoredArtifact {
    pub sync_no: String,
    pub artifact_id: String,
    pub artifact_index: usize,
    pub drive_space_type: &'static str,
    pub drive_space_id: String,
    pub drive_node_id: String,
    pub bucket: String,
    pub object_key: String,
    pub content_length: i64,
    pub checksum_sha256_hex: String,
    pub sync_status: &'static str,
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct VoiceDriveStoredArtifactBatch {
    pub task_id: String,
    pub stored: Vec<VoiceDriveStoredArtifact>,
}

#[derive(Debug)]
pub enum VoiceDrivePersistenceError {
    Plan(VoiceDrivePlanError),
    Drive(DriveServiceError),
}

impl From<VoiceDrivePlanError> for VoiceDrivePersistenceError {
    fn from(value: VoiceDrivePlanError) -> Self {
        Self::Plan(value)
    }
}

impl From<DriveServiceError> for VoiceDrivePersistenceError {
    fn from(value: DriveServiceError) -> Self {
        Self::Drive(value)
    }
}

impl std::fmt::Display for VoiceDrivePersistenceError {
    fn fmt(&self, formatter: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Self::Plan(error) => write!(formatter, "{error}"),
            Self::Drive(error) => write!(formatter, "drive persistence failed: {error:?}"),
        }
    }
}

impl std::error::Error for VoiceDrivePersistenceError {}

#[async_trait(?Send)]
pub trait VoiceDriveUploadExecutor {
    async fn ensure_ai_generated_space(
        &self,
        tenant_id: &str,
        space_id: &str,
        owner_subject_type: &str,
        owner_subject_id: &str,
        operator_id: &str,
    ) -> Result<String, DriveServiceError>;

    async fn prepare_upload(
        &self,
        command: PrepareUploaderUploadCommand,
    ) -> Result<DriveUploadItem, DriveServiceError>;
}

pub struct DriveWorkspaceVoiceUploadExecutor<U, P>
where
    U: DriveUploaderStore,
    P: DriveSpaceStore,
{
    uploader: DriveUploaderService<U>,
    spaces: DriveSpaceService<P>,
}

pub struct DriveWorkspaceVoiceBytesPersister<P, W, O>
where
    P: DriveSpaceStore,
    W: DriveWorkspaceStore,
    O: DriveObjectStore,
{
    spaces: DriveSpaceService<P>,
    workspace: DriveWorkspaceService<W>,
    object_store: O,
    bucket: String,
    storage_provider_id: String,
}

impl<P, W, O> DriveWorkspaceVoiceBytesPersister<P, W, O>
where
    P: DriveSpaceStore,
    W: DriveWorkspaceStore,
    O: DriveObjectStore,
{
    pub fn new(
        spaces: DriveSpaceService<P>,
        workspace: DriveWorkspaceService<W>,
        object_store: O,
        bucket: impl Into<String>,
        storage_provider_id: impl Into<String>,
    ) -> Self {
        Self {
            spaces,
            workspace,
            object_store,
            bucket: bucket.into(),
            storage_provider_id: storage_provider_id.into(),
        }
    }

    pub async fn persist(
        &self,
        batch: VoiceGeneratedArtifactBytesBatch,
    ) -> Result<VoiceDriveStoredArtifactBatch, VoiceDrivePersistenceError> {
        persist_voice_generated_artifact_bytes_to_drive(batch, self).await
    }
}

impl<U, P> DriveWorkspaceVoiceUploadExecutor<U, P>
where
    U: DriveUploaderStore,
    P: DriveSpaceStore,
{
    pub fn new(uploader: DriveUploaderService<U>, spaces: DriveSpaceService<P>) -> Self {
        Self { uploader, spaces }
    }
}

pub async fn persist_voice_generated_artifact_bytes_to_drive<P, W, O>(
    batch: VoiceGeneratedArtifactBytesBatch,
    persister: &DriveWorkspaceVoiceBytesPersister<P, W, O>,
) -> Result<VoiceDriveStoredArtifactBatch, VoiceDrivePersistenceError>
where
    P: DriveSpaceStore,
    W: DriveWorkspaceStore,
    O: DriveObjectStore,
{
    let artifacts = batch
        .artifacts
        .iter()
        .map(|item| item.artifact.clone())
        .collect::<Vec<_>>();
    let plan = plan_voice_drive_uploads(VoiceGeneratedArtifactBatch {
        tenant_id: batch.tenant_id,
        organization_id: batch.organization_id,
        task_id: batch.task_id,
        actor: batch.actor,
        provider_code: batch.provider_code,
        model: batch.model,
        artifacts,
        now_epoch_ms: batch.now_epoch_ms,
    })?;
    let drive_space_id = ensure_ai_generated_space_with_service(
        &persister.spaces,
        &plan.tenant_id,
        &plan.drive_space_id,
        plan.owner_subject_type,
        &plan.owner_subject_id,
        &plan.operator_id,
    )
    .await?;
    let mut stored = Vec::with_capacity(plan.uploads.len());

    for (upload, artifact_bytes) in plan.uploads.into_iter().zip(batch.artifacts.into_iter()) {
        let node_id = format!(
            "voice-drive-node-{}-{:04}",
            plan.task_id, upload.artifact_index
        );
        let object_id = format!(
            "voice-drive-object-{}-{:04}",
            plan.task_id, upload.artifact_index
        );
        let bytes = artifact_bytes.bytes;
        let content_length = i64::try_from(bytes.len()).map_err(|_| {
            VoiceDrivePersistenceError::Plan(VoiceDrivePlanError::Validation(
                "generated artifact bytes length exceeds supported range".to_string(),
            ))
        })?;
        let actual_checksum_sha256_hex = sha256_hex_prefixed(&bytes);
        if let Some(expected_checksum_sha256_hex) = artifact_bytes.artifact.checksum_sha256_hex {
            let expected_checksum_sha256_hex =
                normalize_sha256_checksum(expected_checksum_sha256_hex)?;
            if expected_checksum_sha256_hex != actual_checksum_sha256_hex {
                return Err(VoiceDrivePersistenceError::Plan(
                    VoiceDrivePlanError::Validation(
                        "checksum_sha256_hex does not match generated bytes".to_string(),
                    ),
                ));
            }
        }
        let checksum_sha256_hex = actual_checksum_sha256_hex;
        let object_key = DriveStorageKeyService::build_object_key(BuildStorageObjectKeyCommand {
            tenant_id: &plan.tenant_id,
            space_id: &drive_space_id,
            node_id: &node_id,
            version_no: 1,
            object_id: &object_id,
        })
        .map_err(|message| {
            VoiceDrivePersistenceError::Plan(VoiceDrivePlanError::Validation(message))
        })?;

        persister
            .object_store
            .put_object(PutObjectRequest {
                locator: DriveObjectLocator {
                    bucket: persister.bucket.clone(),
                    object_key: object_key.clone(),
                },
                content_type: Some(upload.command.content_type.clone()),
                metadata: std::collections::BTreeMap::from([
                    ("sdkwork-domain".to_string(), "voice".to_string()),
                    ("sdkwork-task-id".to_string(), plan.task_id.clone()),
                    (
                        "sdkwork-artifact-id".to_string(),
                        upload.artifact_id.clone(),
                    ),
                ]),
                body: bytes,
                checksum_sha256_hex: Some(checksum_sha256_hex.clone()),
            })
            .await
            .map_err(|error| {
                VoiceDrivePersistenceError::Drive(DriveServiceError::Internal(format!(
                    "drive object store put_object failed: {error}"
                )))
            })?;

        persister
            .workspace
            .ensure_nodes(EnsureDriveWorkspaceNodesCommand {
                tenant_id: plan.tenant_id.clone(),
                space_id: drive_space_id.clone(),
                operator_id: plan.operator_id.clone(),
                nodes: vec![EnsureDriveWorkspaceNode::file(
                    upload.logical_path.clone(),
                    DriveWorkspaceObjectRef {
                        storage_provider_id: persister.storage_provider_id.clone(),
                        bucket: persister.bucket.clone(),
                        object_key: object_key.clone(),
                        content_type: upload.command.content_type,
                        content_length,
                        checksum_sha256_hex: checksum_sha256_hex.clone(),
                    },
                )],
            })
            .await?;
        let drive_node = persister
            .workspace
            .resolve_path(ResolveDriveWorkspacePathCommand {
                tenant_id: plan.tenant_id.clone(),
                space_id: drive_space_id.clone(),
                logical_path: upload.logical_path.clone(),
            })
            .await?
            .ok_or_else(|| {
                VoiceDrivePersistenceError::Drive(DriveServiceError::Internal(format!(
                    "drive workspace node missing after ensure: {}",
                    upload.logical_path
                )))
            })?;

        stored.push(VoiceDriveStoredArtifact {
            sync_no: upload.sync_no,
            artifact_id: upload.artifact_id,
            artifact_index: upload.artifact_index,
            drive_space_type: plan.drive_space_type,
            drive_space_id: drive_space_id.clone(),
            drive_node_id: drive_node.id,
            bucket: persister.bucket.clone(),
            object_key,
            content_length,
            checksum_sha256_hex,
            sync_status: "uploaded",
        });
    }

    Ok(VoiceDriveStoredArtifactBatch {
        task_id: plan.task_id,
        stored,
    })
}

async fn ensure_ai_generated_space_with_service<P>(
    spaces: &DriveSpaceService<P>,
    tenant_id: &str,
    space_id: &str,
    owner_subject_type: &str,
    owner_subject_id: &str,
    operator_id: &str,
) -> Result<String, DriveServiceError>
where
    P: DriveSpaceStore,
{
    let existing = spaces
        .list_spaces(ListSpacesCommand {
            tenant_id: tenant_id.to_string(),
            owner_subject_type: Some(owner_subject_type.to_string()),
            owner_subject_id: Some(owner_subject_id.to_string()),
        })
        .await?
        .into_iter()
        .find(|space| space.space_type == DriveSpaceType::AiGenerated);
    if let Some(space) = existing {
        return Ok(space.id);
    }

    match spaces
        .create_space(CreateSpaceCommand {
            id: space_id.to_string(),
            tenant_id: tenant_id.to_string(),
            owner_subject_type: owner_subject_type.to_string(),
            owner_subject_id: owner_subject_id.to_string(),
            display_name: "AI Generated".to_string(),
            space_type: DriveSpaceType::AiGenerated,
            operator_id: operator_id.to_string(),
        })
        .await
    {
        Ok(space) => Ok(space.id),
        Err(DriveServiceError::Conflict(_)) => spaces
            .list_spaces(ListSpacesCommand {
                tenant_id: tenant_id.to_string(),
                owner_subject_type: Some(owner_subject_type.to_string()),
                owner_subject_id: Some(owner_subject_id.to_string()),
            })
            .await?
            .into_iter()
            .find(|space| space.space_type == DriveSpaceType::AiGenerated)
            .map(|space| space.id)
            .ok_or_else(|| DriveServiceError::Conflict("ai-generated space conflict".to_string())),
        Err(error) => Err(error),
    }
}

#[async_trait(?Send)]
impl<U, P> VoiceDriveUploadExecutor for DriveWorkspaceVoiceUploadExecutor<U, P>
where
    U: DriveUploaderStore,
    P: DriveSpaceStore,
{
    async fn ensure_ai_generated_space(
        &self,
        tenant_id: &str,
        space_id: &str,
        owner_subject_type: &str,
        owner_subject_id: &str,
        operator_id: &str,
    ) -> Result<String, DriveServiceError> {
        let existing = self
            .spaces
            .list_spaces(ListSpacesCommand {
                tenant_id: tenant_id.to_string(),
                owner_subject_type: Some(owner_subject_type.to_string()),
                owner_subject_id: Some(owner_subject_id.to_string()),
            })
            .await?
            .into_iter()
            .find(|space| space.space_type == DriveSpaceType::AiGenerated);
        if let Some(space) = existing {
            return Ok(space.id);
        }

        match self
            .spaces
            .create_space(CreateSpaceCommand {
                id: space_id.to_string(),
                tenant_id: tenant_id.to_string(),
                owner_subject_type: owner_subject_type.to_string(),
                owner_subject_id: owner_subject_id.to_string(),
                display_name: "AI Generated".to_string(),
                space_type: DriveSpaceType::AiGenerated,
                operator_id: operator_id.to_string(),
            })
            .await
        {
            Ok(space) => Ok(space.id),
            Err(DriveServiceError::Conflict(_)) => self
                .spaces
                .list_spaces(ListSpacesCommand {
                    tenant_id: tenant_id.to_string(),
                    owner_subject_type: Some(owner_subject_type.to_string()),
                    owner_subject_id: Some(owner_subject_id.to_string()),
                })
                .await?
                .into_iter()
                .find(|space| space.space_type == DriveSpaceType::AiGenerated)
                .map(|space| space.id)
                .ok_or_else(|| {
                    DriveServiceError::Conflict("ai-generated space conflict".to_string())
                }),
            Err(error) => Err(error),
        }
    }

    async fn prepare_upload(
        &self,
        command: PrepareUploaderUploadCommand,
    ) -> Result<DriveUploadItem, DriveServiceError> {
        self.uploader.prepare_upload(command).await
    }
}

impl std::fmt::Display for VoiceDrivePlanError {
    fn fmt(&self, formatter: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Self::Validation(message) => write!(formatter, "validation failed: {message}"),
        }
    }
}

impl std::error::Error for VoiceDrivePlanError {}

pub fn plan_voice_drive_uploads(
    batch: VoiceGeneratedArtifactBatch,
) -> Result<VoiceDriveUploadPlan, VoiceDrivePlanError> {
    let tenant_id = require_identifier(batch.tenant_id, "tenant_id")?;
    let task_id = require_identifier(batch.task_id, "task_id")?;
    let provider_code = require_identifier(batch.provider_code, "provider_code")?;
    if batch.artifacts.is_empty() {
        return Err(VoiceDrivePlanError::Validation(
            "artifacts must not be empty".to_string(),
        ));
    }
    if batch.now_epoch_ms <= 0 {
        return Err(VoiceDrivePlanError::Validation(
            "now_epoch_ms must be greater than 0".to_string(),
        ));
    }

    let actor_context = resolve_actor_context(batch.actor)?;
    let drive_space_id = ai_generated_space_id(&actor_context);
    let mut uploads = Vec::with_capacity(batch.artifacts.len());

    for (artifact_index, artifact) in batch.artifacts.into_iter().enumerate() {
        let artifact_id = require_identifier(artifact.artifact_id, "artifact_id")?;
        let file_name = require_file_name(artifact.file_name)?;
        let content_type = normalize_content_type(artifact.content_type)?;
        if artifact.content_length < 0 {
            return Err(VoiceDrivePlanError::Validation(
                "content_length must be greater than or equal to 0".to_string(),
            ));
        }
        let source_uri = require_non_empty(artifact.source_uri, "source_uri")?;
        let upload_profile_code = upload_profile_for_kind(&artifact.kind).to_string();
        let logical_path = format!(
            "{task_id}/{artifact_index:04}-{file_name}",
            artifact_index = artifact_index
        );
        let sync_no = format!("voice-drive-sync-{task_id}-{artifact_index:04}");
        let upload_id = format!("voice-drive-upload-{task_id}-{artifact_index:04}");
        let file_fingerprint = artifact.checksum_sha256_hex.clone().unwrap_or_else(|| {
            format!(
                "voice-source:{}:{}",
                provider_code,
                stable_suffix(&source_uri)
            )
        });
        let operator_id = actor_context.operator_id.clone();

        let command = PrepareUploaderUploadCommand {
            id: upload_id,
            task_id: format!("{task_id}:{artifact_index:04}"),
            tenant_id: tenant_id.clone(),
            organization_id: batch.organization_id.clone(),
            actor: actor_context.uploader_actor.clone(),
            app_id: VOICE_DRIVE_APP_ID.to_string(),
            app_resource_type: VOICE_DRIVE_APP_RESOURCE_TYPE.to_string(),
            app_resource_id: task_id.clone(),
            scene: Some("ai_generated".to_string()),
            source: Some(format!("provider:{provider_code}")),
            upload_profile_code,
            file_fingerprint,
            original_file_name: file_name,
            content_type,
            content_length: artifact.content_length,
            chunk_size_bytes: VOICE_DRIVE_DEFAULT_CHUNK_SIZE_BYTES,
            target: UploaderTarget::Space {
                space_id: drive_space_id.clone(),
                parent_node_id: None,
                share_token: None,
            },
            retention: UploaderRetention::LongTerm,
            operator_id,
            now_epoch_ms: batch.now_epoch_ms,
        };

        uploads.push(VoiceDriveArtifactUploadPlan {
            sync_no,
            artifact_id,
            artifact_index,
            actor_type: actor_context.actor_type.clone(),
            user_id: actor_context.user_id.clone(),
            anonymous_id: actor_context.anonymous_id.clone(),
            provider_asset_id: artifact.provider_asset_id,
            source_uri,
            logical_path,
            sync_status: "pending_upload",
            command,
        });
    }

    Ok(VoiceDriveUploadPlan {
        tenant_id,
        task_id,
        drive_space_type: VOICE_DRIVE_AI_GENERATED_SPACE_TYPE,
        drive_space_id,
        owner_subject_type: actor_context.owner_subject_type,
        owner_subject_id: actor_context.owner_subject_id,
        operator_id: actor_context.operator_id,
        uploads,
    })
}

pub async fn persist_voice_generated_artifacts_to_drive<E>(
    batch: VoiceGeneratedArtifactBatch,
    executor: &E,
) -> Result<VoiceDrivePersistenceResult, VoiceDrivePersistenceError>
where
    E: VoiceDriveUploadExecutor,
{
    let plan = plan_voice_drive_uploads(batch)?;
    let drive_space_id = executor
        .ensure_ai_generated_space(
            &plan.tenant_id,
            &plan.drive_space_id,
            plan.owner_subject_type,
            &plan.owner_subject_id,
            &plan.operator_id,
        )
        .await?;
    let mut uploaded = Vec::with_capacity(plan.uploads.len());

    for upload in plan.uploads {
        let item = executor.prepare_upload(upload.command).await?;
        uploaded.push(VoiceDriveUploadedArtifact {
            sync_no: upload.sync_no,
            artifact_id: upload.artifact_id,
            artifact_index: upload.artifact_index,
            drive_space_type: plan.drive_space_type,
            drive_space_id: drive_space_id.clone(),
            drive_node_id: item.node_id,
            drive_upload_item_id: item.id,
            drive_upload_session_id: item.upload_session_id,
            sync_status: "uploading",
        });
    }

    Ok(VoiceDrivePersistenceResult {
        task_id: plan.task_id,
        uploaded,
    })
}

#[derive(Clone, Debug)]
struct ActorContext {
    actor_type: String,
    user_id: Option<String>,
    anonymous_id: Option<String>,
    owner_subject_type: &'static str,
    owner_subject_id: String,
    operator_id: String,
    uploader_actor: UploaderActor,
}

fn resolve_actor_context(
    actor: GeneratedArtifactActor,
) -> Result<ActorContext, VoiceDrivePlanError> {
    match actor {
        GeneratedArtifactActor::Anonymous { anonymous_id } => {
            let anonymous_id = require_identifier(anonymous_id, "anonymous_id")?;
            Ok(ActorContext {
                actor_type: "anonymous".to_string(),
                user_id: None,
                anonymous_id: Some(anonymous_id.clone()),
                owner_subject_type: "app",
                owner_subject_id: format!("app:{VOICE_DRIVE_APP_ID}:anonymous"),
                operator_id: anonymous_id.clone(),
                uploader_actor: UploaderActor::Anonymous { anonymous_id },
            })
        }
        GeneratedArtifactActor::User { user_id } => {
            let user_id = require_identifier(user_id, "user_id")?;
            Ok(ActorContext {
                actor_type: "user".to_string(),
                user_id: Some(user_id.clone()),
                anonymous_id: None,
                owner_subject_type: "user",
                owner_subject_id: user_id.clone(),
                operator_id: user_id.clone(),
                uploader_actor: UploaderActor::User { user_id },
            })
        }
        GeneratedArtifactActor::System { operator_id } => {
            let operator_id = require_identifier(operator_id, "operator_id")?;
            Ok(ActorContext {
                actor_type: "system".to_string(),
                user_id: None,
                anonymous_id: None,
                owner_subject_type: "app",
                owner_subject_id: format!("app:{VOICE_DRIVE_APP_ID}:system"),
                operator_id: operator_id.clone(),
                uploader_actor: UploaderActor::System { operator_id },
            })
        }
    }
}

fn ai_generated_space_id(actor: &ActorContext) -> String {
    if actor.owner_subject_type == "app" {
        return format!(
            "space-ai-generated-{}",
            stable_suffix(&actor.owner_subject_id)
        );
    }

    format!(
        "space-ai-generated-{}-{}",
        actor.owner_subject_type,
        stable_suffix(&actor.owner_subject_id)
    )
}

fn upload_profile_for_kind(kind: &VoiceGeneratedArtifactKind) -> &'static str {
    match kind {
        VoiceGeneratedArtifactKind::Image => "image",
        VoiceGeneratedArtifactKind::Video => "video",
        VoiceGeneratedArtifactKind::Transcript | VoiceGeneratedArtifactKind::Translation => "text",
        VoiceGeneratedArtifactKind::Audio
        | VoiceGeneratedArtifactKind::Music
        | VoiceGeneratedArtifactKind::SoundEffect => "audio",
    }
}

fn require_identifier(value: String, field_name: &str) -> Result<String, VoiceDrivePlanError> {
    let value = require_non_empty(value, field_name)?;
    if value.len() > 255 || !value.chars().all(is_allowed_identifier_char) {
        return Err(VoiceDrivePlanError::Validation(format!(
            "{field_name} contains invalid characters"
        )));
    }
    Ok(value)
}

fn require_non_empty(value: String, field_name: &str) -> Result<String, VoiceDrivePlanError> {
    let value = value.trim().to_string();
    if value.is_empty() {
        return Err(VoiceDrivePlanError::Validation(format!(
            "{field_name} is required"
        )));
    }
    Ok(value)
}

fn require_file_name(value: String) -> Result<String, VoiceDrivePlanError> {
    let value = require_non_empty(value, "file_name")?;
    if value.len() > 255 || value.contains('/') || value.contains('\\') || value.contains('\0') {
        return Err(VoiceDrivePlanError::Validation(
            "file_name must be a valid file name".to_string(),
        ));
    }
    Ok(value)
}

fn normalize_content_type(value: String) -> Result<String, VoiceDrivePlanError> {
    let value = require_non_empty(value, "content_type")?.to_ascii_lowercase();
    if value.len() < 3
        || value.len() > 255
        || value.matches('/').count() != 1
        || value.chars().any(char::is_whitespace)
    {
        return Err(VoiceDrivePlanError::Validation(
            "content_type must be a valid media type".to_string(),
        ));
    }
    Ok(value)
}

fn normalize_sha256_checksum(value: String) -> Result<String, VoiceDrivePlanError> {
    let value = require_non_empty(value, "checksum_sha256_hex")?.to_ascii_lowercase();
    let checksum = value
        .strip_prefix("sha256:")
        .map(str::to_string)
        .unwrap_or_else(|| value.clone());
    if checksum.len() != 64 || checksum.chars().any(|ch| !ch.is_ascii_hexdigit()) {
        return Err(VoiceDrivePlanError::Validation(
            "checksum_sha256_hex must be sha256:<64 lowercase hex> or 64 hex".to_string(),
        ));
    }
    Ok(format!("sha256:{checksum}"))
}

fn is_allowed_identifier_char(ch: char) -> bool {
    ch.is_ascii_alphanumeric() || matches!(ch, '.' | '_' | ':' | '@' | '-')
}

fn stable_suffix(value: &str) -> String {
    value
        .chars()
        .map(|ch| {
            if ch.is_ascii_alphanumeric() {
                ch.to_ascii_lowercase()
            } else {
                '-'
            }
        })
        .collect::<String>()
        .trim_matches('-')
        .chars()
        .take(80)
        .collect()
}

fn sha256_hex_prefixed(bytes: &[u8]) -> String {
    let mut hasher = Sha256::new();
    hasher.update(bytes);
    format!("sha256:{:x}", hasher.finalize())
}
