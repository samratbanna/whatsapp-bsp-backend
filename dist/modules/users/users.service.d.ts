import { Model } from 'mongoose';
import { UserDocument } from './schemas/user.schema';
import { CreateUserDto, UpdateUserDto, ChangePasswordDto } from './dto/user.dto';
import { UserStatus } from '../../common/enums';
export declare class UsersService {
    private userModel;
    constructor(userModel: Model<UserDocument>);
    create(dto: CreateUserDto): Promise<UserDocument>;
    findAll(orgId?: string, status?: UserStatus): Promise<UserDocument[]>;
    findOne(id: string): Promise<UserDocument>;
    findByEmail(email: string, includePassword?: boolean): Promise<UserDocument | null>;
    update(id: string, dto: UpdateUserDto): Promise<UserDocument>;
    changePassword(id: string, dto: ChangePasswordDto): Promise<void>;
    suspend(id: string): Promise<UserDocument>;
    activate(id: string): Promise<UserDocument>;
    updateRefreshToken(id: string, token: string | null): Promise<void>;
    updateLastLogin(id: string): Promise<void>;
    validateRefreshToken(id: string, token: string): Promise<boolean>;
    remove(id: string): Promise<void>;
    seedSuperAdmin(email: string, password: string): Promise<void>;
}
