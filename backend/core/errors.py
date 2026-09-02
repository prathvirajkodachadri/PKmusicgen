"""
Custom errors with user-friendly messages
"""

class PKMusicGenError(Exception):
    """Base error"""
    def __init__(self, message: str, user_message: str = None, code: str = "UNKNOWN"):
        super().__init__(message)
        self.user_message = user_message or message
        self.code = code

class ModelNotInstalledError(PKMusicGenError):
    def __init__(self, model_id: str):
        super().__init__(
            f"Model {model_id} not installed",
            f"Model not installed. Open Model Manager to download '{model_id}'.",
            code="MODEL_NOT_INSTALLED"
        )
        self.model_id = model_id

class InsufficientVRAMError(PKMusicGenError):
    def __init__(self, required_gb: float, available_gb: float = None):
        msg = f"Not enough GPU memory. Required: {required_gb}GB"
        if available_gb:
            msg += f", Available: {available_gb}GB"
        super().__init__(
            msg,
            "Not enough GPU memory for this model. Try Low VRAM mode or a smaller model, or use CPU mode.",
            code="INSUFFICIENT_VRAM"
        )

class FFmpegNotFoundError(PKMusicGenError):
    def __init__(self):
        super().__init__(
            "FFmpeg not found",
            "FFmpeg is required for this operation. Please install FFmpeg and ensure it's in PATH. See docs/troubleshooting.md",
            code="FFMPEG_NOT_FOUND"
        )

class OfflineModeError(PKMusicGenError):
    def __init__(self, action: str = "download models"):
        super().__init__(
            f"Offline mode enabled, cannot {action}",
            f"Offline Mode is ON. Cannot {action} while offline. Disable Offline Mode in Settings to allow network access.",
            code="OFFLINE_MODE"
        )

class InvalidPromptError(PKMusicGenError):
    def __init__(self, reason: str):
        super().__init__(
            f"Invalid prompt: {reason}",
            f"Invalid prompt: {reason}",
            code="INVALID_PROMPT"
        )

class GenerationFailedError(PKMusicGenError):
    def __init__(self, reason: str):
        super().__init__(
            f"Generation failed: {reason}",
            f"Audio generation failed: {reason}. Check logs for details.",
            code="GENERATION_FAILED"
        )

class AudioExportError(PKMusicGenError):
    def __init__(self, reason: str):
        super().__init__(
            f"Export failed: {reason}",
            f"Audio export failed: {reason}",
            code="EXPORT_FAILED"
        )
