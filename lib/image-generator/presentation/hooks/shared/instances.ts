import { 
  GetGenerationsUseCase,
  GetGenerationStatsUseCase,
  CancelGenerationUseCase,
  SaveGenerationToDAMUseCase,
  GenerateImageUseCase
} from '../../../application/use-cases';
import { SupabaseGenerationRepository } from '../../../infrastructure/persistence/supabase/SupabaseGenerationRepository';
import { ReplicateFluxProvider } from '../../../infrastructure/providers/replicate/ReplicateFluxProvider';

// Repository and Use Case Instances (Lazy initialization for performance and to avoid client-side env access)
let _repository: SupabaseGenerationRepository | null = null;
let _provider: ReplicateFluxProvider | null = null;
let _getGenerationsUseCase: GetGenerationsUseCase | null = null;
let _getGenerationStatsUseCase: GetGenerationStatsUseCase | null = null;
let _cancelGenerationUseCase: CancelGenerationUseCase | null = null;
let _saveGenerationToDAMUseCase: SaveGenerationToDAMUseCase | null = null;
let _generateImageUseCase: GenerateImageUseCase | null = null;

function getRepository(): SupabaseGenerationRepository {
  if (!_repository) {
    _repository = new SupabaseGenerationRepository();
  }
  return _repository;
}

function getProvider(): ReplicateFluxProvider {
  if (!_provider) {
    _provider = new ReplicateFluxProvider();
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

 