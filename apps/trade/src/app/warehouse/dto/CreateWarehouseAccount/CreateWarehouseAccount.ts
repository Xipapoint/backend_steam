import { IsString, IsNotEmpty } from 'class-validator';

export class CreateWarehouseAccount {
  @IsString()
  @IsNotEmpty()
  steamId: string;

  @IsString()
  @IsNotEmpty()
  tradeUserId: string;

  @IsString()
  @IsNotEmpty()
  refferalCode: string;
}