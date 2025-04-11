import React, { useState, useEffect, useRef } from 'react';
import { Plus, Search, CheckCircle2, Circle, Trash2, Sun, Moon, Clock, Calendar, Image, Mic, File, X } from 'lucide-react';
import AudioPlayer, { RHAP_UI } from 'react-h5-audio-player';
import 'react-h5-audio-player/lib/styles.css';

interface Todo {
  id: number;
  text: string;
  completed: boolean;
  dueDate?: string;
  dueTime?: string;
}

interface Attachment {
  type: 'image' | 'voice' | 'document';
  url: string;
  name: string;
}

interface Note {
  id: number;
  title: string;
  subtitle: string;
  content: string;
  createdAt: string;
  attachments: Attachment[];
}

type FilterType = 'all' | 'active' | 'completed';
type ViewType = 'todos' | 'notes';

function App() {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedMode = localStorage.getItem('darkMode');
    return savedMode ? JSON.parse(savedMode) : false;
  });
  const [todos, setTodos] = useState<Todo[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [newTodo, setNewTodo] = useState('');
  const [newDueDate, setNewDueDate] = useState('');
  const [newDueTime, setNewDueTime] = useState('');
  const [filter, setFilter] = useState<FilterType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [view, setView] = useState<ViewType>('todos');
  const [newNote, setNewNote] = useState({ title: '', subtitle: '', content: '' });
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);

  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(isDarkMode));
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder.current = new MediaRecorder(stream);
      audioChunks.current = [];

      mediaRecorder.current.ondataavailable = (event) => {
        audioChunks.current.push(event.data);
      };

      mediaRecorder.current.onstop = () => {
        const audioBlob = new Blob(audioChunks.current, { type: 'audio/wav' });
        const audioUrl = URL.createObjectURL(audioBlob);
        setAttachments([...attachments, {
          type: 'voice',
          url: audioUrl,
          name: `Recording ${new Date().toLocaleTimeString()}`
        }]);
      };

      mediaRecorder.current.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error accessing microphone:', error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorder.current && isRecording) {
      mediaRecorder.current.stop();
      setIsRecording(false);
      mediaRecorder.current.stream.getTracks().forEach(track => track.stop());
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'document') => {
    const file = event.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setAttachments([...attachments, {
        type,
        url,
        name: file.name
      }]);
    }
  };

  const removeAttachment = (index: number) => {
    const newAttachments = [...attachments];
    if (newAttachments[index].type === 'voice') {
      URL.revokeObjectURL(newAttachments[index].url);
    }
    newAttachments.splice(index, 1);
    setAttachments(newAttachments);
  };

  const addTodo = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTodo.trim()) {
      setTodos([...todos, {
        id: Date.now(),
        text: newTodo.trim(),
        completed: false,
        dueDate: newDueDate,
        dueTime: newDueTime
      }]);
      setNewTodo('');
      setNewDueDate('');
      setNewDueTime('');
    }
  };

  const addNote = () => {
    if (newNote.title.trim() && newNote.content.trim()) {
      setNotes([...notes, {
        id: Date.now(),
        title: newNote.title,
        subtitle: newNote.subtitle,
        content: newNote.content,
        createdAt: new Date().toLocaleString(),
        attachments: attachments
      }]);
      setNewNote({ title: '', subtitle: '', content: '' });
      setAttachments([]);
      setIsAddingNote(false);
    }
  };

  const toggleTodo = (id: number) => {
    setTodos(todos.map(todo =>
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    ));
  };

  const deleteTodo = (id: number) => {
    setTodos(todos.filter(todo => todo.id !== id));
  };

  const deleteNote = (id: number) => {
    const noteToDelete = notes.find(note => note.id === id);
    if (noteToDelete) {
      noteToDelete.attachments.forEach(attachment => {
        if (attachment.type === 'voice') {
          URL.revokeObjectURL(attachment.url);
        }
      });
    }
    setNotes(notes.filter(note => note.id !== id));
  };

  const filteredTodos = todos
    .filter(todo => {
      if (filter === 'active') return !todo.completed;
      if (filter === 'completed') return todo.completed;
      return true;
    })
    .filter(todo =>
      todo.text.toLowerCase().includes(searchQuery.toLowerCase())
    );

  const filteredNotes = notes.filter(note =>
    note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    note.subtitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
    note.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className={`min-h-screen transition-colors ${isDarkMode ? 'dark bg-gray-900' : 'bg-gradient-to-br from-purple-50 to-blue-50'} py-8 px-4`}>
      <div className="max-w-2xl mx-auto">
        <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-lg p-6 md:p-8`}>
          <div className="flex justify-between items-center mb-8">
            <h1 className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
              {view === 'todos' ? 'Todo List' : 'Notes'}
            </h1>
            <div className="flex gap-4">
              <button
                onClick={() => setView(view === 'todos' ? 'notes' : 'todos')}
                className={`px-4 py-2 rounded-lg ${isDarkMode ? 'bg-gray-700 text-white hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'} transition-colors`}
              >
                {view === 'todos' ? 'Switch to Notes' : 'Switch to Todos'}
              </button>
              <button
                onClick={() => setIsDarkMode(!isDarkMode)}
                className={`p-2 rounded-lg ${isDarkMode ? 'bg-gray-700 text-white hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'} transition-colors`}
              >
                {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative mb-6">
            <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${isDarkMode ? 'text-gray-400' : 'text-gray-400'} h-5 w-5`} />
            <input
              type="text"
              placeholder="Search..."
              className={`w-full pl-10 pr-4 py-2 rounded-lg ${
                isDarkMode
                  ? 'bg-gray-700 text-white border-gray-600 focus:ring-purple-500'
                  : 'bg-white border-gray-200 focus:ring-purple-500'
              } border focus:outline-none focus:ring-2 focus:border-transparent`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {view === 'todos' ? (
            <>
              {/* Add Todo Form */}
              <form onSubmit={addTodo} className="flex flex-col gap-2 mb-6">
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Add a new todo..."
                    className={`flex-1 px-4 py-2 rounded-lg ${
                      isDarkMode
                        ? 'bg-gray-700 text-white border-gray-600'
                        : 'bg-white border-gray-200'
                    } border focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent`}
                    value={newTodo}
                    onChange={(e) => setNewTodo(e.target.value)}
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-colors"
                  >
                    <Plus className="h-5 w-5" />
                  </button>
                </div>
                <div className="flex gap-2">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-gray-400" />
                    <input
                      type="date"
                      className={`px-2 py-1 rounded-lg ${
                        isDarkMode
                          ? 'bg-gray-700 text-white border-gray-600'
                          : 'bg-white border-gray-200'
                      } border focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent`}
                      value={newDueDate}
                      onChange={(e) => setNewDueDate(e.target.value)}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-gray-400" />
                    <input
                      type="time"
                      className={`px-2 py-1 rounded-lg ${
                        isDarkMode
                          ? 'bg-gray-700 text-white border-gray-600'
                          : 'bg-white border-gray-200'
                      } border focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent`}
                      value={newDueTime}
                      onChange={(e) => setNewDueTime(e.target.value)}
                    />
                  </div>
                </div>
              </form>

              {/* Filter Buttons */}
              <div className="flex gap-2 mb-6">
                <button
                  onClick={() => setFilter('all')}
                  className={`px-4 py-2 rounded-lg ${
                    filter === 'all'
                      ? 'bg-purple-600 text-white'
                      : isDarkMode
                      ? 'bg-gray-700 text-white hover:bg-gray-600'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  } transition-colors`}
                >
                  All
                </button>
                <button
                  onClick={() => setFilter('active')}
                  className={`px-4 py-2 rounded-lg ${
                    filter === 'active'
                      ? 'bg-purple-600 text-white'
                      : isDarkMode
                      ? 'bg-gray-700 text-white hover:bg-gray-600'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  } transition-colors`}
                >
                  Active
                </button>
                <button
                  onClick={() => setFilter('completed')}
                  className={`px-4 py-2 rounded-lg ${
                    filter === 'completed'
                      ? 'bg-purple-600 text-white'
                      : isDarkMode
                      ? 'bg-gray-700 text-white hover:bg-gray-600'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  } transition-colors`}
                >
                  Completed
                </button>
              </div>

              {/* Todo List */}
              <div className="space-y-2">
                {filteredTodos.map(todo => (
                  <div
                    key={todo.id}
                    className={`flex items-center gap-3 p-3 rounded-lg group ${
                      isDarkMode
                        ? 'bg-gray-700 hover:bg-gray-600'
                        : 'bg-gray-50 hover:bg-gray-100'
                    } transition-colors`}
                  >
                    <button
                      onClick={() => toggleTodo(todo.id)}
                      className={`${isDarkMode ? 'text-gray-400 hover:text-purple-400' : 'text-gray-400 hover:text-purple-600'} transition-colors`}
                    >
                      {todo.completed ? (
                        <CheckCircle2 className="h-5 w-5 text-purple-600" />
                      ) : (
                        <Circle className="h-5 w-5" />
                      )}
                    </button>
                    <div className="flex-1">
                      <span
                        className={`block ${
                          todo.completed
                            ? 'text-gray-400 line-through'
                            : isDarkMode
                            ? 'text-white'
                            : 'text-gray-700'
                        }`}
                      >
                        {todo.text}
                      </span>
                      {(todo.dueDate || todo.dueTime) && (
                        <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                          {todo.dueDate && `Due: ${todo.dueDate}`}
                          {todo.dueTime && ` at ${todo.dueTime}`}
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => deleteTodo(todo.id)}
                      className={`opacity-0 group-hover:opacity-100 ${
                        isDarkMode
                          ? 'text-gray-400 hover:text-red-400'
                          : 'text-gray-400 hover:text-red-600'
                      } transition-all`}
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                ))}
                {filteredTodos.length === 0 && (
                  <p className={`text-center ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} py-4`}>
                    {searchQuery
                      ? 'No todos match your search'
                      : 'No todos yet. Add one above!'}
                  </p>
                )}
              </div>
            </>
          ) : (
            <>
              {/* Notes Section */}
              <div className="mb-6">
                <button
                  onClick={() => setIsAddingNote(true)}
                  className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-colors flex items-center justify-center gap-2"
                >
                  <Plus className="h-5 w-5" />
                  Add New Note
                </button>
              </div>

              {isAddingNote && (
                <div className={`mb-6 p-4 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                  <input
                    type="text"
                    placeholder="Title"
                    className={`w-full px-4 py-2 mb-2 rounded-lg ${
                      isDarkMode
                        ? 'bg-gray-600 text-white border-gray-500'
                        : 'bg-white border-gray-200'
                    } border focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent`}
                    value={newNote.title}
                    onChange={(e) => setNewNote({ ...newNote, title: e.target.value })}
                  />
                  <input
                    type="text"
                    placeholder="Subtitle"
                    className={`w-full px-4 py-2 mb-2 rounded-lg ${
                      isDarkMode
                        ? 'bg-gray-600 text-white border-gray-500'
                        : 'bg-white border-gray-200'
                    } border focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent`}
                    value={newNote.subtitle}
                    onChange={(e) => setNewNote({ ...newNote, subtitle: e.target.value })}
                  />
                  <textarea
                    placeholder="Note content"
                    className={`w-full px-4 py-2 mb-4 rounded-lg ${
                      isDarkMode
                        ? 'bg-gray-600 text-white border-gray-500'
                        : 'bg-white border-gray-200'
                    } border focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent`}
                    rows={4}
                    value={newNote.content}
                    onChange={(e) => setNewNote({ ...newNote, content: e.target.value })}
                  />

                  {/* Attachment Section */}
                  <div className="mb-4">
                    <div className="flex gap-2 mb-4">
                      <label className={`flex items-center gap-2 px-4 py-2 rounded-lg cursor-pointer ${
                        isDarkMode ? 'bg-gray-600 hover:bg-gray-500' : 'bg-gray-200 hover:bg-gray-300'
                      } transition-colors`}>
                        <Image className="h-5 w-5" />
                        <span>Add Image</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleFileUpload(e, 'image')}
                        />
                      </label>
                      <button
                        onClick={isRecording ? stopRecording : startRecording}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                          isRecording
                            ? 'bg-red-500 hover:bg-red-600'
                            : isDarkMode
                            ? 'bg-gray-600 hover:bg-gray-500'
                            : 'bg-gray-200 hover:bg-gray-300'
                        } transition-colors`}
                      >
                        <Mic className="h-5 w-5" />
                        <span>{isRecording ? 'Stop Recording' : 'Record Voice'}</span>
                      </button>
                      <label className={`flex items-center gap-2 px-4 py-2 rounded-lg cursor-pointer ${
                        isDarkMode ? 'bg-gray-600 hover:bg-gray-500' : 'bg-gray-200 hover:bg-gray-300'
                      } transition-colors`}>
                        <File className="h-5 w-5" />
                        <span>Add Document</span>
                        <input
                          type="file"
                          accept=".pdf,.doc,.docx,.txt"
                          className="hidden"
                          onChange={(e) => handleFileUpload(e, 'document')}
                        />
                      </label>
                    </div>

                    {/* Attachments Preview */}
                    {attachments.length > 0 && (
                      <div className="space-y-2">
                        {attachments.map((attachment, index) => (
                          <div
                            key={index}
                            className={`flex items-center gap-2 p-2 rounded-lg ${
                              isDarkMode ? 'bg-gray-600' : 'bg-gray-100'
                            }`}
                          >
                            {attachment.type === 'image' && (
                              <img
                                src={attachment.url}
                                alt={attachment.name}
                                className="w-12 h-12 object-cover rounded"
                              />
                            )}
                            {attachment.type === 'voice' && (
                              <div className="flex-1">
                                <AudioPlayer
                                  src={attachment.url}
                                  className="rounded-lg"
                                  layout="horizontal-reverse"
                                  customControlsSection={[RHAP_UI.MAIN_CONTROLS, RHAP_UI.VOLUME_CONTROLS]}
                                  customProgressBarSection={[RHAP_UI.PROGRESS_BAR]}
                                  showJumpControls={false}
                                  showDownloadProgress={false}
                                  autoPlayAfterSrcChange={false}
                                />
                              </div>
                            )}
                            {attachment.type === 'document' && (
                              <div className="flex items-center gap-2">
                                <File className="h-5 w-5" />
                                <span className={`${isDarkMode ? 'text-white' : 'text-gray-700'}`}>
                                  {attachment.name}
                                </span>
                              </div>
                            )}
                            <button
                              onClick={() => removeAttachment(index)}
                              className="p-1 hover:bg-gray-700 rounded-full"
                            >
                              <X className="h-4 w-4 text-gray-400" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => {
                        setIsAddingNote(false);
                        setAttachments([]);
                      }}
                      className={`px-4 py-2 rounded-lg ${
                        isDarkMode
                          ? 'bg-gray-600 text-white hover:bg-gray-500'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      } transition-colors`}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={addNote}
                      className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-colors"
                    >
                      Save Note
                    </button>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                {filteredNotes.map(note => (
                  <div
                    key={note.id}
                    className={`p-4 rounded-lg ${
                      isDarkMode ? 'bg-gray-700' : 'bg-gray-50'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                          {note.title}
                        </h3>
                        {note.subtitle && (
                          <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            {note.subtitle}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => deleteNote(note.id)}
                        className={`${
                          isDarkMode
                            ? 'text-gray-400 hover:text-red-400'
                            : 'text-gray-400 hover:text-red-600'
                        } transition-colors`}
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                    <p className={`text-sm mb-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      {note.content}
                    </p>

                    {/* Note Attachments */}
                    {note.attachments && note.attachments.length > 0 && (
                      <div className="space-y-2 mb-4">
                        {note.attachments.map((attachment, index) => (
                          <div
                            key={index}
                            className={`p-2 rounded-lg ${
                              isDarkMode ? 'bg-gray-600' : 'bg-gray-100'
                            }`}
                          >
                            {attachment.type === 'image' && (
                              <img
                                src={attachment.url}
                                alt={attachment.name}
                                className="max-w-full h-auto rounded-lg"
                              />
                            )}
                            {attachment.type === 'voice' && (
                              <AudioPlayer
                                src={attachment.url}
                                className="rounded-lg"
                                layout="horizontal-reverse"
                                customControlsSection={[RHAP_UI.MAIN_CONTROLS, RHAP_UI.VOLUME_CONTROLS]}
                                customProgressBarSection={[RHAP_UI.PROGRESS_BAR]}
                                showJumpControls={false}
                                showDownloadProgress={false}
                                autoPlayAfterSrcChange={false}
                              />
                            )}
                            {attachment.type === 'document' && (
                              <div className="flex items-center gap-2">
                                <File className="h-5 w-5" />
                                <a
                                  href={attachment.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className={`${isDarkMode ? 'text-blue-400' : 'text-blue-600'} hover:underline`}
                                >
                                  {attachment.name}
                                </a>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    <p className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                      Created: {note.createdAt}
                    </p>
                  </div>
                ))}
                {filteredNotes.length === 0 && (
                  <p className={`text-center ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} py-4`}>
                    {searchQuery
                      ? 'No notes match your search'
                      : 'No notes yet. Add one above!'}
                  </p>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;