import { FetchRequest } from "../api/client";


export async function login_user({username, email, password}){
    
    return await FetchRequest(
        "/auth/login",
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ username: username, email: email, password: password }),
        }
    )
    
}


export async function autologin(){
    return await FetchRequest(
        "/auth/auto_login",
        {
            method: "POST",
            credentials: "include",
            headers: {
                "Content-Type": "application/json",
            }
        }
    )
}


export function test(){
    FetchRequest(
        "/users/test",
        {
            method: "POST",
            credentials: "include",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ username: "username", email: "name@email.com", password: "pass" }),
        }
    )
}

export async function cors_test(){
    return await FetchRequest(
        "/auth/cors_test",
        {
            method: "GET",
            credentials: "include",
            headers: {
                "Content-Type": "application/json",
            }
        }
    )
}


export async function get_user_profile(){
    return await FetchRequest(
        "/users/profile",
        {
            method: "GET",
            credentials: "include",
            headers: {
                "Content-Type": "application/json",
            }
        }
    )
}


export async function get_communities(){
    return await FetchRequest(
        "/users/communities",
        {
            method: "GET",
            credentials: "include",
            headers: {
                "Content-Type": "application/json",
            }
        }
    )
}


export async function LogoutUser(){
    return await FetchRequest(
        "/auth/logout",
        {
            method: "GET",
            credentials: "include",
            headers: {
                "Content-Type": "application/json",
            }
        }
    )
}