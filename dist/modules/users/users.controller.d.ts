import { UserStatus } from '../../common/enums';
import { UsersService } from './users.service';
import { CreateUserDto, UpdateUserDto, ChangePasswordDto } from './dto/user.dto';
export declare class UsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
    create(dto: CreateUserDto): Promise<import("./schemas/user.schema").UserDocument>;
    findAll(orgId?: string, status?: UserStatus): Promise<import("./schemas/user.schema").UserDocument[]>;
    findOne(id: string): Promise<import("./schemas/user.schema").UserDocument>;
    update(id: string, dto: UpdateUserDto): Promise<import("./schemas/user.schema").UserDocument>;
    suspend(id: string): Promise<import("./schemas/user.schema").UserDocument>;
    activate(id: string): Promise<import("./schemas/user.schema").UserDocument>;
    remove(id: string): Promise<void>;
    getProfile(userId: string): Promise<import("./schemas/user.schema").UserDocument>;
    updateProfile(userId: string, dto: UpdateUserDto): Promise<import("./schemas/user.schema").UserDocument>;
    changePassword(userId: string, dto: ChangePasswordDto): Promise<void>;
}
