import { Injectable } from "@nestjs/common";
import { Events } from "common/base/events";

export const USER_EXCHANGE = 'user';
const getUserById = 'user.get';

@Injectable()
export class UserEvents extends Events {
    getUserById(id: string){
        return this.request<any>(getUserById, USER_EXCHANGE ,id);
    }

    static GetUserById(){
        return Events.response(
            getUserById,
            USER_EXCHANGE,
            getUserById
        );
    }
}