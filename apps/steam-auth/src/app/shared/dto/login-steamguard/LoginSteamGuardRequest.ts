import { BaseLoginRequest } from '@backend/nestjs';

export interface LoginSteamGuardRequest extends BaseLoginRequest {
    steamGuardCode: string;
    closePage: boolean
}