import { 
  GetGenerationsUseCase,
  GetGenerationStatsUseCase,
  CancelGenerationUseCase,
  SaveGenerationToDAMUseCase,
  GenerateImageUseCase,
  DeleteGenerationUseCase
} from '../../../application/use-cases';
import { SupabaseGenerationRepository } from '../../../infrastructure/persistence/supabase/SupabaseGenerationRepository';
import { ReplicateProvider } from '../../../infrastructure/providers/replicate/ReplicateProvider';

// Repository and Use Case Instances (Lazy initialization for performance and to avoid client-side env access)
let _repository: SupabaseGenerationRepository | null = null;
let _provider: ReplicateProvider | null = null;
let _getGenerationsUseCase: GetGenerationsUseCase | null = null;
let _getGenerationStatsUseCase: GetGenerationStatsUseCase | null = null;
let _cancelGenerationUseCase: CancelGenerationUseCase | null = null;
let _saveGenerationToDAMUseCase: SaveGenerationToDAMUseCase | null = null;
let _generateImageUseCase: GenerateImageUseCase | null = null;
let _deleteGenerationUseCase: DeleteGenerationUseCase | null = null;

function getRepository(): SupabaseGenerationRepository {
  if (!_repository) {
    _repository = new SupabaseGenerationRepository();
  }
  return _repository;
}

function getProvider(): ReplicateProvider {
  if (!_provider) {
    _provider = new ReplicateProvider();
  }
  return _provider;
}

export function getGenerateImageUseCase(): GenerateImageUseCase {
  if (!_generateImageUseCase) {
    _generateImageUseCase = new GenerateImageUseCase(getRepository());
  }
  return _generateImageUseCase;
}

export function getGetGenerationsUseCase(): GetGenerationsUseCase {
  if (!_getGenerationsUseCase) {
    _getGenerationsUseCase = new GetGenerationsUseCase(getRepository());
  }
  return _getGenerationsUseCase;
}

export function getGetGenerationStatsUseCase(): GetGenerationStatsUseCase {
  if (!_getGenerationStatsUseCase) {
    _getGenerationStatsUseCase = new GetGenerationStatsUseCase(getRepository());
  }
  return _getGenerationStatsUseCase;
}

export function getCancelGenerationUseCase(): CancelGenerationUseCase {
  if (!_cancelGenerationUseCase) {
    _cancelGenerationUseCase = new CancelGenerationUseCase(getRepository(), getProvider());
  }
  return _cancelGenerationUseCase;
}

export function getSaveGenerationToDAMUseCase(): SaveGenerationToDAMUseCase {
  if (!_saveGenerationToDAMUseCase) {
    _saveGenerationToDAMUseCase = new SaveGenerationToDAMUseCase(getRepository());
  }
  return _saveGenerationToDAMUseCase;
}

export function getDeleteGenerationUseCase(): DeleteGenerationUseCase {
  if (!_deleteGenerationUseCase) {
    _deleteGenerationUseCase = new DeleteGenerationUseCase(getRepository());
  }
  return _deleteGenerationUseCase;
}

 