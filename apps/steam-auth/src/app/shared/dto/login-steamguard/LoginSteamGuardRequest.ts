import { BaseLoginRequest, Password } from "../BaseLoginRequest";

export interface LoginSteamGuardRequest extends BaseLoginRequest, Password {
    steamGuardCode: string;
    closePage: boolean
}