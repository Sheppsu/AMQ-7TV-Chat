// ==UserScript==
// @name         AMQ 7TV Emote Adder
// @namespace    https://github.com/Sheppsu
// @version      1.0.1
// @description  A way to see 7TV emotes in AMQ chat.
// @author       Sheppsu
// @match        https://animemusicquiz.com/*
// @downloadURL  https://github.com/Sheppsu/AMQ-7TV-Chat/raw/main/script.user.js
// @updateURL    https://github.com/Sheppsu/AMQ-7TV-Chat/raw/main/script.user.js
// @grant        none
// ==/UserScript==


// Global variables

var emoteSets = [];
var emotes = {};


// Local storage

function getLocalEmoteSets() {
    let emoteSets = window.localStorage.getItem("chatEmoteSets");
    if (emoteSets === null) {
        window.localStorage.setItem("chatEmoteSets", "[]");
        emoteSets = [];
    } else {
        emoteSets = JSON.parse(emoteSets);
    }
    return emoteSets;
}

function addLocalEmoteSet(setId) {
    if (emoteSets.includes(setId)) {return false;}
    emoteSets.push(setId);
    window.localStorage.setItem("chatEmoteSets", JSON.stringify(emoteSets));
    return true;
}

function removeLocalEmoteSet(setId) {
    if (!emoteSets.includes(setId)) {return false;}
    emoteSets.splice(emoteSets.indexOf(setId), 1);
    window.localStorage.setItem("chatEmoteSets", JSON.stringify(emoteSets));
    return true;
}

function clearLocalEmoteSets() {
    emoteSets = [];
    window.localStorage.setItem("chatEmoteSets", "[]");
}


// Emote loading

function getEmoteHTML(name, id) {
    return `<img alt="${name}" draggable="false" src="https://cdn.7tv.app/emote/${id}/1x.webp">`;
}

function createEmoteElement(name, id) {
    const img = document.createElement("img");
    img.alt = name;
    img.draggable = false;
    img.src = `https://cdn.7tv.app/emote/${id}/1x.webp`;
    return img;
}

function fetchEmoteSet(setId) {
    return fetch(`https://7tv.io/v3/emote-sets/${setId}`, {method: "GET"})
        .then((response) => {
            if (response.ok) {return response.json();}
            removeLocalEmoteSet(setId);
            return null;
        });
}

function onEmoteClicked(event) {
    const textInput = document.getElementById("gcInput");
    textInput.value += (textInput.value === "" || textInput.value.endsWith(" ") ? "": " ") + event.currentTarget.alt;
}

function createEmotePickerContainer(id, name) {
    const newEmoteContainer = document.createElement("div");
    newEmoteContainer.id = `gcEmotePicker${id}Container`;
    const header = document.createElement("div");
    header.classList.add("gcEmojiPickerHeader");
    header.innerHTML = name;
    const container = document.createElement("div");
    container.classList.add("gcEmojiPickerEmoteContainer");
    newEmoteContainer.appendChild(header);
    newEmoteContainer.appendChild(container);
    return newEmoteContainer;
}

function loadEmoteSet(data) {
    if (data === null) {return;}

    const emotePicker = document.getElementById("gcEmojiPickerContainer");
    const allEmotes = document.getElementById("gcEmojiPickerAllContainer");

    const newEmoteContainer = createEmotePickerContainer(data.id, data.name);
    emotePicker.insertBefore(newEmoteContainer, allEmotes);
    const container = newEmoteContainer.querySelector("div.gcEmojiPickerEmoteContainer");

    for (const emote of data.emotes) {
        emotes[emote.name] = emote.data.id;
        const img = createEmoteElement(emote.name, emote.data.id);
        img.style = "cursor: pointer;";
        img.addEventListener("click", onEmoteClicked);
        container.appendChild(img);
    }
}

function loadEmoteSets(index = 0) {
    if (index >= emoteSets.length) {return;}
    const setId = emoteSets[index];
    fetchEmoteSet(setId).then((data) => {
        if (data !== null) {
            loadEmoteSet(data);
        }
        loadEmoteSets((data === null && emoteSets[index] !== setId) ? index: index+1);
    });
}

function beginLoadingEmotes(channel) {
    if (emoteSets.length == 0) {return false;}
    loadEmoteSets();
    return true;
}

function loadEmoteSetEditor() {
    const emotePicker = document.getElementById("gcEmojiPickerContainer");
    const recentEmotes = document.getElementById("gcEmojiPickerRecentContainer");

    const editor = document.createElement("div");
    const header = document.createElement("div");
    header.classList.add("gcEmojiPickerHeader");
    header.innerHTML = "Edit emote sets:";
    const textInput = document.createElement("input");
    textInput.type = "text";
    textInput.placeholder = "7tv emote set ID";
    textInput.style = "height:24px;background-color:white;color:black;";
    const addButton = document.createElement("input");
    addButton.type = "submit";
    addButton.value = "Add";
    addButton.style = "height:24px;background-color:grey;color:black;";
    const removeButton = document.createElement("input");
    removeButton.type = "submit";
    removeButton.value = "Remove";
    removeButton.style = "height:24px;background-color:grey;color:black;";
    const clearButton = document.createElement("input");
    clearButton.type = "submit";
    clearButton.value = "Clear";
    clearButton.style = "height:24px;background-color:grey;color:black;";

    editor.appendChild(header);
    editor.appendChild(textInput);
    editor.appendChild(addButton);
    editor.appendChild(removeButton);
    editor.appendChild(clearButton);
    emotePicker.insertBefore(editor, recentEmotes);

    addButton.addEventListener("click", (event) => {
        const setId = textInput.value;
        if (setId.trim() !== "" && addLocalEmoteSet(setId)) {
            fetchEmoteSet(setId).then(loadEmoteSet);
        }
        textInput.value = "";
    });
    removeButton.addEventListener("click", (event) => {
        const setId = textInput.value;
        if (setId.trim() !== "" && removeLocalEmoteSet(setId)) {
            document.getElementById(`gcEmotePicker${setId}Container`).remove();
        }
        textInput.value = "";
    });
    clearButton.addEventListener("click", (event) => {
        for (const setId of emoteSets) {
            document.getElementById(`gcEmotePicker${setId}Container`).remove();
        }
        clearLocalEmoteSets();
    });
}

// Tab completion

function getEmoteCompletionList(partialName) {
    const emoteNames = Object.keys(emotes);
    return emoteNames.filter((name) =>
                             name.toLowerCase().startsWith(partialName.toLowerCase())
                            );
}

function onTabPressed(event) {
    event.preventDefault();
    const textInput = event.currentTarget
    const inputVal = textInput.value.trim();
    const currentInputWords = inputVal.split(" ");
    const currentPartialWord = currentInputWords[currentInputWords.length - 1];
    const completionList = getEmoteCompletionList(currentPartialWord);

    if (completionList.length === 0){
        return;
    };

    const emoteName = completionList[0];
    textInput.value = inputVal.replace(currentPartialWord, emoteName+" ");
};

function tabCompletion() {
    const textInput = document.getElementById("gcInput");

    textInput.addEventListener("keydown", (event) => {
        if (event.key === "Tab") {
            onTabPressed(event);
        }
    });
}

// Functionality

function onNewChild(records, observer) {
    for (const record of records) {
        for (const newNode of record.addedNodes) {
            if (!newNode.id.startsWith("gcPlayerMessage")) {return;}
            const msg = newNode.querySelector("span.gcMessage");

            let newMsg = [];
            let containsEmotes = false;
            for (const word of msg.innerHTML.split(" ")) {
                const emoteId = emotes[word];
                if (emoteId === undefined) {
                    newMsg.push(word);
                } else {
                    newMsg.push(getEmoteHTML(word, emoteId));
                    containsEmotes = true;
                }
            }

            if (containsEmotes) {
                msg.innerHTML = newMsg.join(" ");
            }
        }
    }
}

function run() {
    emoteSets = getLocalEmoteSets();
    loadEmoteSetEditor();
    beginLoadingEmotes();
    tabCompletion(); // run tab-completion func
    const observer = new MutationObserver(onNewChild);
    observer.observe(document.getElementById("gcMessageContainer"), {
        childList: true
    });
}


// Running code

function waitForChat() {
    if (document.getElementById("gcMessageContainer") === null) {
        return setTimeout(waitForChat, 500);
    }
    run();
}

waitForChat();
