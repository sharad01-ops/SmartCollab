import { FetchRequest } from "../api/client";



const BASE_URL=import.meta.env.VITE_API_BASE_URL


export async function login_user({username, email, password}){
    
    return await FetchRequest(
        BASE_URL, "/auth/login",
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
        BASE_URL, "/auth/auto_login",
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
        BASE_URL, "/users/test",
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
        BASE_URL, "/auth/cors_test",
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
        BASE_URL, "/users/profile",
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
        BASE_URL, "/users/communities",
        {
            method: "GET",
            credentials: "include",
            headers: {
                "Content-Type": "application/json",
            }
        }
    )
}



export async function change_preferred_language(new_language){
    return await FetchRequest(
        BASE_URL, `/users/change_language/${new_language}`,
        {
            method: "POST",
            credentials: "include",
            headers: {
                "Content-Type": "application/json",
            }
        }
    )
}


export async function LogoutUser(){
    return await FetchRequest(
        BASE_URL, "/auth/logout",
        {
            method: "GET",
            credentials: "include",
            headers: {
                "Content-Type": "application/json",
            }
        }
    )
}