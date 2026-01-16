import { User } from "../entities/user.entity";
import { UserRole } from "../entities/user.entity";

export class UserDataMasker {
    static mask(data: User | User[], role?: UserRole): any {
        if (Array.isArray(data)) {
            return data.map((u) => this.maskSingleUser(u, role));
        }
        return this.maskSingleUser(data, role);
    }

    private static maskSingleUser(user: User, role?: UserRole): any {
        const { passwordHash, ...masked } = user;


        if (role && role === UserRole.ADMIN) {
            return masked;
        }

        // Mask sensitive fields for non-admins
        masked.email = user.email
            ? `${user.email[0]}***${user.email.split("@")[0].slice(-1)}@${user.email.split("@")[1]
            }`
            : "***@***.com";

        masked.phoneNumber = this.maskString(user.phoneNumber);
        masked.identityNumber = this.maskString(user.identityNumber);
        masked.shortAddress = this.maskString(user.shortAddress);

        return masked;
    }

    private static maskString(value: any): string {
        if (!value || typeof value !== "string") return "********";
        if (value.length <= 2) return value[0] + "***"; // very short fields
        return `${value[0]}***${value[value.length - 1]}`;
    }
}
