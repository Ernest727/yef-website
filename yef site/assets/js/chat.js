(function(){
  'use strict';
  const chatButton = document.getElementById('chatButton');
  const chatPanel  = document.getElementById('chatPanel');
  const chatClose  = document.getElementById('chatClose');
  const chatInput  = document.getElementById('chatInput');
  const chatSend   = document.getElementById('chatSend');
  const chatMessages = document.getElementById('chatMessages');
  const typingIndicator = document.getElementById('typingIndicator');

  let isStreaming = false;
  const messages = [{
    role:'system',
    content:'UNIFYING, FACTUAL, HOPEFUL; reply in English, Kiswahili, or Luganda based on user input.'
  }];

  function init(){
    chatButton.addEventListener('click', toggleChat);
    chatClose.addEventListener('click', closeChat);
    chatSend.addEventListener('click', sendMessage);
    chatInput.addEventListener('keypress', (e)=>{ if(e.key==='Enter' && !e.shiftKey){ e.preventDefault(); sendMessage(); } });
    document.addEventListener('click', (e)=>{ if(!chatPanel.contains(e.target) && !chatButton.contains(e.target)) closeChat(); });
  }
  function toggleChat(){ chatPanel.classList.toggle('active'); if(chatPanel.classList.contains('active')) chatInput.focus(); }
  function closeChat(){ chatPanel.classList.remove('active'); }

  async function sendMessage(){
    const message = chatInput.value.trim();
    if(!message || isStreaming) return;

    appendMessage('user', message);
    messages.push({role:'user', content:message});
    chatInput.value='';
    setStreaming(true);
    showTyping();

    try{
      const res = await fetch('/.netlify/functions/chat', {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ messages })
      });
      if(!res.ok) throw new Error('HTTP '+res.status);

      hideTyping();
      const bubble = appendMessage('assistant', '');
      const content = bubble.querySelector('.message-content');

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let assistant = '';

      while(true){
        const {done, value} = await reader.read();
        if(done) break;
        const chunk = decoder.decode(value, {stream:true});
        const lines = chunk.split('\n');
        for(const line of lines){
          if(!line.startsWith('data: ')) continue;
          const data = line.slice(6);
          if(data === '[DONE]') continue;
          try{
            const parsed = JSON.parse(data);
            const delta = parsed.choices?.[0]?.delta?.content;
            if(delta){
              assistant += delta;
              content.textContent = assistant;
              scrollBottom();
            }
          }catch(_){/* ignore malformed */}
        }
      }
      if(assistant) messages.push({role:'assistant', content:assistant});
    }catch(err){
      console.error('Chat error:', err);
      hideTyping();
      appendMessage('assistant','Chat temporarily unavailable. Please try again later or email hello@yefederation.org');
    }finally{
      setStreaming(false);
    }
  }

  function appendMessage(role, text){
    const wrap = document.createElement('div'); wrap.className = 'message '+role;
    const span = document.createElement('div'); span.className='message-content'; span.textContent = text;
    wrap.appendChild(span); chatMessages.appendChild(wrap); scrollBottom(); return wrap;
  }
  function showTyping(){ typingIndicator.classList.add('active'); chatMessages.appendChild(typingIndicator); scrollBottom(); }
  function hideTyping(){ typingIndicator.classList.remove('active'); if(typingIndicator.parentNode===chatMessages) chatMessages.removeChild(typingIndicator); }
  function setStreaming(v){ isStreaming=v; chatInput.disabled=v; chatSend.disabled=v; }
  function scrollBottom(){ chatMessages.scrollTop = chatMessages.scrollHeight; }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', init); else init();
})();