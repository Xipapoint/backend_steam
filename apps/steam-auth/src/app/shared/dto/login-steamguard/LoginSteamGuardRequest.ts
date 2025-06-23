import { BaseLoginRequest } from "../BaseLoginRequest";

export interface LoginSteamGuardRequest extends BaseLoginRequest {
    steamGuardCode: string;
    closePage: boolean
}