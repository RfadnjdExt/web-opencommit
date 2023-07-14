fetch(
    "https://chat.openai.com/backend-api/conversations?offset=0&limit=28&order=updated",
    {
        headers: {
            accept: "*/*",
            "accept-language": "en-US,en;q=0.9,ja;q=0.8,id;q=0.7",
            authorization: "Bearer ${}",
            "content-type": "application/json",
            "sec-ch-ua":
                '"Google Chrome";v="117", "Not;A=Brand";v="8", "Chromium";v="117"',
            "sec-ch-ua-mobile": "?0",
            "sec-ch-ua-platform": '"macOS"',
            "sec-fetch-dest": "empty",
            "sec-fetch-mode": "cors",
            "sec-fetch-site": "same-origin",
        },
        referrer: "https://chat.openai.com/?model=text-davinci-002-render-sha",
        referrerPolicy: "same-origin",
        body: null,
        method: "GET",
        mode: "cors",
        credentials: "include",
    }
)
    .then((OLzYarTHDs) => OLzYarTHDs.json())
    .then((EPSzYQJSqj) =>
        EPSzYQJSqj.items.forEach(
            (fxEYZBOett) =>
                fxEYZBOett.title === "New chat" ??
                fetch(
                    `https://chat.openai.com/backend-api/conversation/${fxEYZBOett.id}`,
                    {
                        headers: {
                            accept: "*/*",
                            "accept-language":
                                "en-US,en;q=0.9,ja;q=0.8,id;q=0.7",
                            authorization: "Bearer ${}",
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
                        body: '{"is_visible":false}',
                        method: "PATCH",
                        mode: "cors",
                        credentials: "include",
                    }
                )
        )
    );
