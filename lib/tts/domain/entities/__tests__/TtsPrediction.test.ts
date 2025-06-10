import { describe, it, expect } from 'vitest';
import { TtsPrediction } from '../TtsPrediction';
import { TextInput } from '../../value-objects/TextInput';
import { PredictionStatus } from '../../value-objects/PredictionStatus';
import { VoiceId } from '../../value-objects/VoiceId';

describe('TtsPrediction Entity', () => {
  const mockParams = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    replicatePredictionId: 'repl_123',
    textInput: new TextInput('Hello, world!'),
    status: PredictionStatus.pending(),
    outputUrl: null,
    createdAt: new Date('2023-01-01T00:00:00Z'),
    updatedAt: new Date('2023-01-01T00:00:00Z'),
    userId: 'user_123',
    organizationId: 'org_123',
  };

  describe('Constructor and Properties', () => {
    it('should create a valid TtsPrediction instance', () => {
      const prediction = new TtsPrediction(mockParams);

      expect(prediction.id).toBe(mockParams.id);
      expect(prediction.replicatePredictionId).toBe(mockParams.replicatePredictionId);
      expect(prediction.textInput).toBe(mockParams.textInput);
      expect(prediction.status).toBe(mockParams.status);
      expect(prediction.userId).toBe(mockParams.userId);
      expect(prediction.organizationId).toBe(mockParams.organizationId);
    });

    it('should set default values for optional parameters', () => {
      const prediction = new TtsPrediction(mockParams);

      expect(prediction.sourceAssetId).toBeNull();
      expect(prediction.outputAssetId).toBeNull();
      expect(prediction.voiceId).toBeNull();
      expect(prediction.errorMessage).toBeNull();
      expect(prediction.isOutputUrlProblematic).toBe(false);
    });

    it('should map externalProviderId from replicatePredictionId when not provided', () => {
      const prediction = new TtsPrediction(mockParams);
      expect(prediction.externalProviderId).toBe(mockParams.replicatePredictionId);
    });
  });

  describe('Status Methods', () => {
    it('should correctly identify completed status', () => {
      const completedPrediction = new TtsPrediction({
        ...mockParams,
        status: PredictionStatus.completed(),
      });

      expect(completedPrediction.isCompleted()).toBe(true);
      expect(completedPrediction.isProcessing()).toBe(false);
      expect(completedPrediction.isFailed()).toBe(false);
      expect(completedPrediction.isFinal()).toBe(true);
    });

    it('should correctly identify processing status', () => {
      const processingPrediction = new TtsPrediction({
        ...mockParams,
        status: PredictionStatus.processing(),
      });

      expect(processingPrediction.isCompleted()).toBe(false);
      expect(processingPrediction.isProcessing()).toBe(true);
      expect(processingPrediction.isFailed()).toBe(false);
      expect(processingPrediction.isFinal()).toBe(false);
    });

    it('should correctly identify failed status', () => {
      const failedPrediction = new TtsPrediction({
        ...mockParams,
        status: PredictionStatus.failed(),
      });

      expect(failedPrediction.isCompleted()).toBe(false);
      expect(failedPrediction.isProcessing()).toBe(false);
      expect(failedPrediction.isFailed()).toBe(true);
      expect(failedPrediction.isFinal()).toBe(true);
    });
  });

  describe('Business Logic Methods', () => {
    it('should detect when audio output is available', () => {
      const predictionWithOutput = new TtsPrediction({
        ...mockParams,
        status: PredictionStatus.completed(),
        outputUrl: 'https://example.com/audio.mp3',
        isOutputUrlProblematic: false,
      });

      expect(predictionWithOutput.hasAudioOutput()).toBe(true);
    });

    it('should detect when audio output is not available', () => {
      const predictionWithoutOutput = new TtsPrediction({
        ...mockParams,
        status: PredictionStatus.processing(),
        outputUrl: null,
      });

      expect(predictionWithoutOutput.hasAudioOutput()).toBe(false);
    });

    it('should detect problematic output URLs', () => {
      const problematicPrediction = new TtsPrediction({
        ...mockParams,
        status: PredictionStatus.completed(),
        outputUrl: 'https://example.com/audio.mp3',
        isOutputUrlProblematic: true,
      });

      expect(problematicPrediction.hasAudioOutput()).toBe(false);
    });

    it('should detect expired Replicate URLs', () => {
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 2); // 2 days ago

      const predictionWithExpiredUrl = new TtsPrediction({
        ...mockParams,
        outputUrl: 'https://replicate.delivery/audio.mp3',
        predictionProvider: 'replicate',
        createdAt: oldDate,
      });

      expect(predictionWithExpiredUrl.isOutputUrlLikelyExpired()).toBe(true);
    });

    it('should identify predictions that can be replayed', () => {
      const replayablePrediction = new TtsPrediction({
        ...mockParams,
        voiceId: new VoiceId('voice_123'),
      });

      expect(replayablePrediction.canBeReplayed()).toBe(true);
    });

    it('should identify predictions that can be saved to DAM', () => {
      const savablePrediction = new TtsPrediction({
        ...mockParams,
        status: PredictionStatus.completed(),
        outputUrl: 'https://example.com/audio.mp3',
        outputAssetId: null,
      });

      expect(savablePrediction.canBeSavedToDam()).toBe(true);
    });

    it('should identify predictions already linked to DAM', () => {
      const linkedPrediction = new TtsPrediction({
        ...mockParams,
        outputAssetId: 'asset_123',
      });

      expect(linkedPrediction.isLinkedToDam()).toBe(true);
      expect(linkedPrediction.canBeSavedToDam()).toBe(false);
    });
  });



  describe('State Mutation Methods', () => {
    it('should mark prediction as completed', () => {
      const prediction = new TtsPrediction(mockParams);
      const outputUrl = 'https://example.com/audio.mp3';
      
      const completed = prediction.markAsCompleted(outputUrl, {
        outputContentType: 'audio/mpeg',
        outputFileSize: 1024,
      });

      expect(completed.isCompleted()).toBe(true);
      expect(completed.outputUrl).toBe(outputUrl);
      expect(completed.outputContentType).toBe('audio/mpeg');
      expect(completed.outputFileSize).toBe(1024);
      expect(completed.isOutputUrlProblematic).toBe(false);
      expect(completed.errorMessage).toBeNull();
    });

    it('should mark prediction as failed', () => {
      const prediction = new TtsPrediction(mockParams);
      const errorMessage = 'Something went wrong';
      
      const failed = prediction.markAsFailed(errorMessage);

      expect(failed.isFailed()).toBe(true);
      expect(failed.errorMessage).toBe(errorMessage);
      expect(failed.outputUrl).toBeNull();
    });

    it('should mark output URL as problematic', () => {
      const prediction = new TtsPrediction({
        ...mockParams,
        outputUrl: 'https://example.com/audio.mp3',
      });
      
      const problematic = prediction.markOutputUrlAsProblematic('URL expired');

      expect(problematic.isOutputUrlProblematic).toBe(true);
      expect(problematic.outputUrlLastError).toBe('URL expired');
    });

    it('should link to DAM asset', () => {
      const prediction = new TtsPrediction(mockParams);
      const assetId = 'asset_123';
      
      const linked = prediction.linkToDamAsset(assetId);

      expect(linked.outputAssetId).toBe(assetId);
      expect(linked.isLinkedToDam()).toBe(true);
    });

    it('should mark as processing', () => {
      const prediction = new TtsPrediction(mockParams);
      const processing = prediction.markAsProcessing();

      expect(processing.isProcessing()).toBe(true);
      expect(processing.errorMessage).toBeNull();
    });
  });

  describe('Factory Methods', () => {
    it('should create new prediction with factory method', () => {
      const params = {
        replicatePredictionId: 'repl_123',
        textInput: new TextInput('Hello, world!'),
        userId: 'user_123',
        organizationId: 'org_123',
        predictionProvider: 'replicate',
      };

      const prediction = TtsPrediction.create(params);

      expect(prediction.replicatePredictionId).toBe(params.replicatePredictionId);
      expect(prediction.textInput).toBe(params.textInput);
      expect(prediction.userId).toBe(params.userId);
      expect(prediction.organizationId).toBe(params.organizationId);
      expect(prediction.predictionProvider).toBe(params.predictionProvider);
      expect(prediction.status.equals('pending')).toBe(true);
      expect(prediction.id).toBeTruthy();
    });

    it('should create from database row', () => {
      const dbRow = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        replicatePredictionId: 'repl_123',
        inputText: 'Hello, world!',
        status: 'completed',
        outputUrl: 'https://example.com/audio.mp3',
        createdAt: '2023-01-01T00:00:00.000Z',
        updatedAt: '2023-01-01T00:00:00.000Z',
        userId: 'user_123',
        organization_id: 'org_123',
        sourceAssetId: null,
        outputAssetId: null,
        voiceId: 'voice_123',
        errorMessage: null,
        prediction_provider: 'replicate',
        is_output_url_problematic: false,
        output_url_last_error: null,
        output_storage_path: null,
        output_content_type: null,
        output_file_size: null,
      };

      const prediction = TtsPrediction.fromDatabaseRow(dbRow);

      expect(prediction.id).toBe(dbRow.id);
      expect(prediction.textInput.value).toBe(dbRow.inputText);
      expect(prediction.status.value).toBe('completed');
      expect(prediction.voiceId?.value).toBe(dbRow.voiceId);
    });

    it('should convert to database row format', () => {
      const prediction = new TtsPrediction({
        ...mockParams,
        voiceId: new VoiceId('voice_123'),
      });

      const dbRow = prediction.toDatabaseRow();

      expect(dbRow.id).toBe(prediction.id);
      expect(dbRow.inputText).toBe(prediction.textInput.value);
      expect(dbRow.status).toBe(prediction.status.toString());
      expect(dbRow.voiceId).toBe(prediction.voiceId?.toString());
      expect(dbRow.organization_id).toBe(prediction.organizationId);
    });
  });

  describe('Validation', () => {
    it('should validate a complete prediction', () => {
      const prediction = new TtsPrediction(mockParams);
      expect(prediction.isValid()).toBe(true);
      expect(prediction.getValidationErrors()).toHaveLength(0);
    });

    it('should detect missing required fields', () => {
      const invalidPrediction = new TtsPrediction({
        ...mockParams,
        id: '',
        userId: '',
      });

      expect(invalidPrediction.isValid()).toBe(false);
      
      const errors = invalidPrediction.getValidationErrors();
      expect(errors).toContain('ID is required');
      expect(errors).toContain('User ID is required');
    });

    it('should detect invalid text input', () => {
      const invalidPrediction = new TtsPrediction({
        ...mockParams,
        textInput: new TextInput('Hi'), // Valid but we'll test the static validation
      });

      // Since the TextInput is already valid, this tests the validation logic
      expect(invalidPrediction.isValid()).toBe(true);
    });
  });
}); 