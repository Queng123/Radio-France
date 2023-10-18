const API_KEY = "YOUR_API_KEY";

const transcriptQuery = `
query getTranscript($showURL: String!) {
    showByUrl(
        url: $showURL
    ) {
        diffusionsConnection {
        edges {
            node {
                url
                transcript {
                    segments {
                        start
                        text
                        type
                    }
                }
            }
        }
        }
    }
}
`;

var globalData = {
    currentShow: null,
    transcripts: null,
};

const fetchGraphQL = async (query, currentShow) => {
    const response = await fetch("https://openapi.radiofrance.fr/v1/graphql?x-token=" + API_KEY, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ query, variables: { showURL: currentShow } }),
    });
    return await response.json();
};

const getCurrentShow = () => {
    const selector = "#player > div.media.svelte-1i7nef6 > a:nth-child(2)";
    const currentShow = document.querySelector(selector);
    return currentShow.href;
};

const getCurrentEpisode = () => {
    const selector = "#player > div.media.svelte-1i7nef6 > a:nth-child(3)";
    const currentEpisode = document.querySelector(selector);
    return currentEpisode.href;
}

const getTimeLeft = () => {
    const timeLeft = document.getElementsByClassName("time time-left")[0];
    return timeLeft.innerText;
};

const getCurrentEpisodeNode = (transcripts) => {
    const currentEpisode = getCurrentEpisode();
    const currentEpisodeUrlLastElement = currentEpisode.split("/").pop();
    const currentEpisodeNode = transcripts.find((transcript) => transcript.node.url.includes(currentEpisodeUrlLastElement));
    return currentEpisodeNode;
};

const getCurrentSentence = (timeLeft, currentEpisodeNode) => {
    const timeLeftInSeconds = timeLeft.split(":").reduce((acc, time) => (60 * acc) + +time);
    let lastSentence = "";
    for (let node of currentEpisodeNode.node.transcript.segments) {
        if (node.start <= timeLeftInSeconds) {
            lastSentence = node.text;
        }
    }
    return lastSentence;
};

const createTranscriptTab = () => {
    let transcriptTab = document.createElement("div");
    transcriptTab.id = "player-transcript";
    transcriptTab.style = "background-color: #212121; color: white; display: flex; flex-direction: row;";
    const stickyPlayerWrapper = document.getElementsByClassName("StickyPlayer-wrapper")[0];
    stickyPlayerWrapper.insertBefore(transcriptTab, stickyPlayerWrapper.firstChild);
    let transcriptTitle = document.createElement("div");
    let transcriptTextBar = document.createElement("p");
    transcriptTextBar.className = "transcript-text-bar";
    transcriptTextBar.style = "margin: 10px; font-size: 18px;";
    transcriptTitle.innerText = "Transcript";
    transcriptTitle.style = "margin: 10px; font-size: 18px; font-weight: bold;";
    transcriptTab.appendChild(transcriptTitle);
    transcriptTab.appendChild(transcriptTextBar);
    return transcriptTab;
};

const getTranscriptTextBar = () => {
    let transcriptTab = document.getElementById("player-transcript");
    if (!transcriptTab) {
        transcriptTab = createTranscriptTab();
    }
    let transcriptTextBar = transcriptTab.getElementsByClassName("transcript-text-bar")[0];
    return transcriptTextBar;
};

const updateTranscript = async () => {
    try {
        const timeLeft = getTimeLeft();
        const currentShow = getCurrentShow();
        if (currentShow !== globalData.currentShow) {
            globalData.currentShow = currentShow;
            const queryResult = await fetchGraphQL(transcriptQuery, currentShow);
            globalData.transcripts = queryResult.data.showByUrl.diffusionsConnection.edges;
        }
        if (globalData.transcripts) {
            let currentEpisodeNode = getCurrentEpisodeNode(globalData.transcripts);
            let currentSentence = getCurrentSentence(timeLeft, currentEpisodeNode);
            let transcriptTextBar = getTranscriptTextBar();
            transcriptTextBar.innerText = currentSentence;
        }
    } catch (e) {
        console.warn("Error while updating transcript");
        console.warn(e);
    }
};

setInterval(updateTranscript, 2000);
