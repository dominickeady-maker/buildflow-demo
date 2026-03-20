import { useState } from 'react';
import { Bot, Send, X } from 'lucide-react';

export default function AIAssistant() {
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([
    { role: 'assistant', content: 'Hello! I\'m the BuildFlow AI Assistant. You can ask me about task statuses, site progress, material requests, and more. (Integration with Voiceflow API coming soon)' }
  ]);
  const [input, setInput] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = input.trim();
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setInput('');

    setTimeout(() => {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'This is a placeholder response. Once integrated with Voiceflow API, I\'ll provide intelligent responses about your construction projects, task statuses, materials, and more.'
      }]);
    }, 500);
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 text-white rounded-full shadow-xl shadow-orange-900/50 flex items-center justify-center transition-all z-50 transform hover:scale-110"
      >
        {isOpen ? <X className="w-6 h-6" /> : <Bot className="w-6 h-6" />}
      </button>

      {isOpen && (
        <div className="fixed bottom-24 right-6 w-96 h-[500px] bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-xl shadow-2xl flex flex-col z-50">
          <div className="bg-gradient-to-r from-orange-600 to-orange-500 text-white px-4 py-3 rounded-t-xl flex items-center gap-2">
            <Bot className="w-5 h-5" />
            <h3 className="font-semibold">BuildFlow AI Assistant</h3>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] px-4 py-2 rounded-lg ${
                    message.role === 'user'
                      ? 'bg-gradient-to-r from-orange-600 to-orange-500 text-white'
                      : 'bg-slate-700 text-slate-200 border border-slate-600'
                  }`}
                >
                  <p className="text-sm">{message.content}</p>
                </div>
              </div>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="border-t border-slate-700 p-3">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about projects, tasks, materials..."
                className="flex-1 px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-sm text-white placeholder-slate-500 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 text-white rounded-lg transition-all shadow-lg"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </form>

          <div className="px-3 pb-3">
            <p className="text-xs text-slate-400 text-center">
              Voiceflow integration pending
            </p>
          </div>
        </div>
      )}
    </>
  );
}
