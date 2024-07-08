"use client";
import { fetchUserToken } from "@/utils/fetchToken";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";

const WS_URL = "ws://localhost:8081";

export const useSocket = () => {
    const [socket, setSocket] = useState<WebSocket | null>(null);
    const [error, setError] = useState<string | null>(null);
    // const { data: session, status } = useSession();

    const connect = async() => {
        
        const data = await fetchUserToken();
        
        const ws = new WebSocket(`${WS_URL}?token=${data?.token}`);
        console.log("Connecting to WebSocket...");

        ws.onopen = () => {
            console.log("WebSocket connection opened.");
            setSocket(ws);
            setError(null);
        };

        ws.onclose = (event) => {
            console.log("WebSocket connection closed.", event);
            setSocket(null);
            if (event.code !== 1000) {
                setError(`WebSocket closed with code: ${event.code}, reason: ${event.reason}`);
                setTimeout(connect, 5000);
            }
        };

        ws.onerror = (event) => {
            console.error('WebSocket error', event);
            setError("WebSocket error");
        };

        ws.onmessage = (message) => {
            console.log("WebSocket message received:", message.data);
        };

        return ws;
    };

    useEffect(() => {

      
        const initiateConnection = async () => {
            const ws = await connect();

            return () => {
                console.log("Closing WebSocket connection...");
                if (ws) {
                    console.log("Closing WebSocket connection...");
                    ws.close();
                }
            };
        };

        initiateConnection();
    }, []);

    return socket;
};
