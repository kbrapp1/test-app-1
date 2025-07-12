/**
 * Auth Application Layer Exports
 * 
 * AI INSTRUCTIONS:
 * - Export only essential application layer components
 * - Include role management functionality
 * - Keep clean API surface for infrastructure layer
 * - Focus on use cases and data contracts
 */

// Use Cases
export { RegisterUserUseCase } from './use-cases/RegisterUserUseCase';
export { LoginUserUseCase } from './use-cases/LoginUserUseCase';
export { SwitchOrganizationUseCase } from './use-cases/SwitchOrganizationUseCase';
export { ChangeUserRoleUseCase } from './use-cases/ChangeUserRoleUseCase';
export { CheckUserPermissionsUseCase } from './use-cases/CheckUserPermissionsUseCase';

// DTOs
export type { 
  UserDTO, 
  CreateUserDTO, 
  UpdateUserProfileDTO,
  UserRoleDTO,
  ChangeUserRoleDTO
} from './dto/UserDTO';

export type { 
  OrganizationDTO, 
  CreateOrganizationDTO, 
  UpdateOrganizationSettingsDTO,
  OrganizationMemberDTO,
  AddOrganizationMemberDTO,
  RemoveOrganizationMemberDTO,
  ChangeOrganizationMemberRoleDTO
} from './dto/OrganizationDTO';

// Use Case Result Types
export type { RegisterUserResult } from './use-cases/RegisterUserUseCase';
export type { LoginUserResult, LoginUserDTO } from './use-cases/LoginUserUseCase';
export type { SwitchOrganizationResult, SwitchOrganizationDTO } from './use-cases/SwitchOrganizationUseCase';
export type { ChangeUserRoleResult } from './use-cases/ChangeUserRoleUseCase';
export type { UserPermissionsResult, CheckPermissionsDTO } from './use-cases/CheckUserPermissionsUseCase';

// Mappers
export { UserMapper } from './mappers/UserMapper'; 