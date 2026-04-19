import { FetchRequest } from "../api/client";

function sleep(ms) {
    console.log("sleeping")

    return new Promise(resolve => setTimeout(resolve, ms));
}

export async function get_community_channels(community_id){
    // await sleep(3000)
    // console.log("sent request")
    return await FetchRequest(
            `/communities/${community_id}/channels`,
            {
                method: "GET",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json",
                }
            }
        )
}



export async function search_communities(sub_str){
    // await sleep(3000)
    // console.log("sent request")
    return await FetchRequest(
            `/communities/search`,
            {
                method: "POST",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ sub_str: `${sub_str}` }),
            }
        )
}



export async function create_community(name){
    // await sleep(3000)
    // console.log("sent request")
    return await FetchRequest(
            `/communities/create`,
            {
                method: "POST",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ community_name: name }),
            }
        )
}

export async function leave_community(community_id){
    // await sleep(3000)
    // console.log("sent request")
    return await FetchRequest(
            `/communities/${community_id}/leave`,
            {
                method: "DELETE",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json",
                }
            }
        )
}

export async function join_community(community_id){
    // await sleep(3000)
    // console.log("sent request")
    return await FetchRequest(
            `/communities/${community_id}/join`,
            {
                method: "POST",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json",
                }
            }
        )
}