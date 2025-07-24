const serverUrl = 'https://aiohatbot.ngrok.app';
const chatbox = document.getElementById('chatbox');
const userInput = document.getElementById('user-input');
const sendButton = document.getElementById('send-button');
const clearHistoryButton = document.getElementById('clear-history');
const characterImage = document.getElementById('character-image');

let userId = localStorage.getItem('userId');
if (!userId) {
    userId = 'user_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('userId', userId);
}

function loadChatHistory() {
    const chatHistory = JSON.parse(localStorage.getItem('chatHistory') || '[]');
    chatHistory.forEach(message => addMessageToUI(message.role, message.content));
}

function saveChatHistory(role, content) {
    const chatHistory = JSON.parse(localStorage.getItem('chatHistory') || '[]');
    chatHistory.push({ role, content });
    localStorage.setItem('chatHistory', JSON.stringify(chatHistory));
}

// 수정된 메시지 UI 추가 함수 - 캐릭터가 각 메시지마다 붙음
function addMessageToUI(role, message) {
    // 메시지 컨테이너 생성
    const messageContainer = document.createElement('div');
    messageContainer.classList.add('message-container');
    messageContainer.classList.add(role === 'user' ? 'user' : 'bot');
    
    // 캐릭터 이미지 생성
    const characterDiv = document.createElement('div');
    characterDiv.classList.add('message-character');
    characterDiv.classList.add(role === 'user' ? 'user' : 'bot');
    
    const characterImg = document.createElement('img');
    if (role === 'user') {
        // 사용자 캐릭터 이미지 (같은 이미지 사용하거나 다른 이미지 사용 가능)
        characterImg.src = 'character-image.png'; // 또는 다른 사용자 이미지
        characterImg.alt = '사용자';
    } else {
        // AI 캐릭터 이미지
        characterImg.src = 'character-image.png';
        characterImg.alt = 'AI 캐릭터';
    }
    
    characterDiv.appendChild(characterImg);
    
    // 메시지 요소 생성
    const messageElement = document.createElement('div');
    messageElement.classList.add('message');
    messageElement.classList.add(role === 'user' ? 'user-message' : 'bot-message');
    messageElement.textContent = message;
    
    // 컨테이너에 캐릭터와 메시지 추가
    messageContainer.appendChild(characterDiv);
    messageContainer.appendChild(messageElement);
    
    // 챗박스에 추가
    chatbox.appendChild(messageContainer);
    chatbox.scrollTop = chatbox.scrollHeight;
}

// 기존 고정 캐릭터 이미지 변경 함수 (호환성을 위해 유지)
function setCharacterImage(isAnimated) {
    // 고정 캐릭터가 숨겨졌으므로 characterImage가 있는지 확인
    if (characterImage) {
        characterImage.src = isAnimated ? 'character-image.gif' : 'character-image.png';
    }
}

function closeKeyboard() {
    if (document.activeElement instanceof HTMLInputElement) {
        document.activeElement.blur();
    }
}

async function sendMessage() {
    const message = userInput.value.trim();
    if (message) {
        // 고정 캐릭터 애니메이션 (있다면)
        setCharacterImage(true);
        
        // 사용자 메시지 추가
        addMessageToUI('user', message);
        saveChatHistory('user', message);
        userInput.value = '';
        
        // 키보드 닫기
        closeKeyboard();
        
        // 로딩 표시 추가
        const loadingContainer = document.createElement('div');
        loadingContainer.classList.add('message-container', 'bot');
        loadingContainer.id = 'loading-message';
        
        const loadingCharacter = document.createElement('div');
        loadingCharacter.classList.add('message-character', 'bot');
        const loadingImg = document.createElement('img');
        loadingImg.src = 'character-image.gif'; // 애니메이션 이미지
        loadingImg.alt = 'AI 캐릭터';
        loadingCharacter.appendChild(loadingImg);
        
        const loadingMessage = document.createElement('div');
        loadingMessage.classList.add('message', 'bot-message');
        loadingMessage.textContent = '답변을 생각하고 있어요...';
        loadingMessage.style.fontStyle = 'italic';
        loadingMessage.style.opacity = '0.8';
        
        loadingContainer.appendChild(loadingCharacter);
        loadingContainer.appendChild(loadingMessage);
        chatbox.appendChild(loadingContainer);
        chatbox.scrollTop = chatbox.scrollHeight;
        
        try {
            const chatHistory = JSON.parse(localStorage.getItem('chatHistory') || '[]');
            const response = await fetch(`${serverUrl}/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    message: message, 
                    user_id: userId,
                    chat_history: chatHistory
                }),
            });
            
            // 로딩 메시지 제거
            const loadingElement = document.getElementById('loading-message');
            if (loadingElement) {
                loadingElement.remove();
            }
            
            if (response.ok) {
                const data = await response.json();
                addMessageToUI('assistant', data.response);
                saveChatHistory('assistant', data.response);
            } else {
                const errorText = await response.text();
                addMessageToUI('assistant', `Error: ${errorText}`);
            }
        } catch (error) {
            // 로딩 메시지 제거
            const loadingElement = document.getElementById('loading-message');
            if (loadingElement) {
                loadingElement.remove();
            }
            addMessageToUI('assistant', `Error: ${error.message}`);
        } finally {
            // 고정 캐릭터 애니메이션 중지
            setCharacterImage(false);
            userInput.focus();
        }
    }
}

async function clearHistory() {
    try {
        const response = await fetch(`${serverUrl}/clear_history`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ user_id: userId }),
        });
        if (response.ok) {
            chatbox.innerHTML = '';
            localStorage.removeItem('chatHistory');
            addMessageToUI('assistant', '대화 내역이 초기화되었습니다.');
        } else {
            const errorText = await response.text();
            addMessageToUI('assistant', `Error: ${errorText}`);
        }
    } catch (error) {
        addMessageToUI('assistant', `Error: ${error.message}`);
    }
}

sendButton.addEventListener('click', sendMessage);

userInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        e.preventDefault(); // 폼 제출 방지
        sendMessage();
    }
});

clearHistoryButton.addEventListener('click', clearHistory);

// 입력 중 고정 캐릭터 애니메이션 (선택사항)
userInput.addEventListener('input', function() {
    setCharacterImage(this.value.trim() !== '');
});

document.addEventListener('DOMContentLoaded', loadChatHistory);