fetch("https://chat.openai.com/backend-api/conversation", {
    headers: {
        accept: "text/event-stream",
        "accept-language": "en-US,en;q=0.9,ja;q=0.8,id;q=0.7",
        authorization: "Bearer %s",
        "content-type": "application/json",
        "sec-ch-ua":
            '"Google Chrome";v="117", "Not;A=Brand";v="8", "Chromium";v="117"',
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": '"macOS"',
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "same-origin",
    },
    referrer: "https://chat.openai.com/",
    referrerPolicy: "same-origin",
    body: "%s",
    method: "POST",
    mode: "cors",
    credentials: "include",
})
    .then((response1) => response1.text())
    .then((textResponse) => {
        console.log(btoa(textResponse));
        fetch(
            "https://chat.openai.com/backend-api/conversations?offset=0&limit=28&order=updated",
            {
                headers: {
                    accept: "*/*",
                    "accept-language": "en-US,en;q=0.9,ja;q=0.8,id;q=0.7",
                    authorization: "Bearer %s",
                    "content-type": "application/json",
                    "sec-ch-ua":
                        '"Google Chrome";v="117", "Not;A=Brand";v="8", "Chromium";v="117"',
                    "sec-ch-ua-mobile": "?0",
                    "sec-ch-ua-platform": '"macOS"',
                    "sec-fetch-dest": "empty",
                    "sec-fetch-mode": "cors",
                    "sec-fetch-site": "same-origin",
                },
                referrer:
                    "https://chat.openai.com/?model=text-davinci-002-render-sha",
                referrerPolicy: "same-origin",
                body: null,
                method: "GET",
                mode: "cors",
                credentials: "include",
            }
        )
            .then((response2) => response2.json())
            .then((jsonData) =>
                jsonData.items.forEach((item) => {
                    if (item.title === "New chat") {
                        fetch(
                            `https://chat.openai.com/backend-api/conversation/${item.id}`,
                            {
                                headers: {
                                    accept: "*/*",
                                    "accept-language":
                                        "en-US,en;q=0.9,ja;q=0.8,id;q=0.7",
                                    authorization: "Bearer %s",
                                    "content-type": "application/json",
                                    "sec-ch-ua":
                                        '"Google Chrome";v="117", "Not;A=Brand";v="8", "Chromium";v="117"',
                                    "sec-ch-ua-mobile": "?0",
                                    "sec-ch-ua-platform": '"macOS"',
                                    "sec-fetch-dest": "empty",
                                    "sec-fetch-mode": "cors",
                                    "sec-fetch-site": "same-origin",
                                },
                                referrer:
                                    "https://chat.openai.com/?model=text-davinci-002-render-sha",
                                referrerPolicy: "same-origin",
                                body: JSON.stringify({ is_visible: false }),
                                method: "PATCH",
                                mode: "cors",
                                credentials: "include",
                            }
                        );
                    }
                })
            );
    });
