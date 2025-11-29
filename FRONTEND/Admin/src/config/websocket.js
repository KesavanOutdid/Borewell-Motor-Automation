const getWebSocketURL = () => {
    const weUrl = process.env.REACT_APP_WE_URL;
    return weUrl.replace(/^http/, "ws");
};

export const WS_URL = getWebSocketURL();
