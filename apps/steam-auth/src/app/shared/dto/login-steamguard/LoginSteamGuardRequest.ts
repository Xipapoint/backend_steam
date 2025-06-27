import { BaseLoginRequest, Password } from '@backend/nestjs';

export interface LoginSteamGuardRequest extends BaseLoginRequest, Password {
    steamGuardCode: string;
    closePage: boolean
}