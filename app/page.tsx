"use client";

import { useState, useCallback } from "react";
import Wheel from "@/components/Wheel";
import { Trash2, RotateCcw, UserPlus, Pencil, Check } from "lucide-react";
import confetti from "canvas-confetti";

export default function Home() {
  const [names, setNames] = useState<string[]>([]);
  const [newName, setNewName] = useState("");
  const [isSpinning, setIsSpinning] = useState(false);
  const [winner, setWinner] = useState<string | null>(null);
  const [removeAfterSelection, setRemoveAfterSelection] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingValue, setEditingValue] = useState("");

  const addName = (e: React.FormEvent) => {
    e.preventDefault();
    if (newName.trim()) {
      setNames([...names, newName.trim()]);
      setNewName("");
    }
  };

  const removeName = (index: number) => {
    setNames(names.filter((_, i) => i !== index));
    if (editingIndex === index) setEditingIndex(null);
  };

  const startEditing = (index: number) => {
    setEditingIndex(index);
    setEditingValue(names[index]);
  };

  const saveEdit = () => {
    if (editingIndex !== null && editingValue.trim()) {
      const newNames = [...names];
      newNames[editingIndex] = editingValue.trim();
      setNames(newNames);
      setEditingIndex(null);
    }
  };

  const handleSpinEnd = useCallback((selectedWinner: string) => {
    setIsSpinning(false);
    setWinner(selectedWinner);
    
    // Trigger confetti
    confetti({
      particleCount: 150,
      spread: 70,
      origin: { y: 0.9 },
      colors: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F', '#BB8FCE'],
    });

    if (removeAfterSelection) {
      setTimeout(() => {
        setNames(prev => prev.filter(n => n !== selectedWinner));
      }, 3000); // Wait for the "wow" moment
    }
  }, [removeAfterSelection]);

  const handleSpinClick = () => {
    if (names.length < 2 || isSpinning) return;
    setWinner(null);
    setIsSpinning(true);
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans selection:bg-rose-100 dark:bg-zinc-950 dark:text-zinc-50">
      <main className="max-w-6xl mx-auto px-6 py-8 md:py-12 grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
        
        {/* Left Side: Wheel */}
        <div className="flex flex-col items-center justify-center space-y-8 ">
          <div className="relative group">
            <div className="absolute -inset-4 bg-gradient-to-r from-rose-400 via-fuchsia-500 to-indigo-500 rounded-full blur-2xl opacity-10 group-hover:opacity-20 transition duration-1000"></div>
            <Wheel items={names} onSpinEnd={handleSpinEnd} isSpinning={isSpinning} />
          </div>
          
          <button
            onClick={handleSpinClick}
            disabled={isSpinning || names.length < 2}
            className="px-12 py-4 bg-zinc-900 text-white rounded-full font-bold text-xl shadow-2xl shadow-zinc-200 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100 disabled:cursor-not-allowed dark:bg-white dark:text-black dark:shadow-none"
          >
            {isSpinning ? "Spinning..." : "SPIN NOW"}
          </button>

          {winner && !isSpinning && (
            <div className="animate-in fade-in zoom-in slide-in-from-bottom-4 duration-700 text-center space-y-4">
              <div className="inline-block px-4 py-1.5 bg-rose-500/10 text-rose-500 rounded-full text-xs font-black uppercase tracking-widest ring-1 ring-rose-500/20">
                Congratulations!
              </div>
              <h2 className="text-6xl md:text-7xl font-black text-rose-500 bg-clip-text text-transparent bg-gradient-to-r from-rose-500 via-fuchsia-600 to-indigo-600 drop-shadow-sm animate-pulse">
                {winner}
              </h2>
            </div>
          )}
        </div>

        {/* Right Side: Settings & Names */}
        <div className="bg-white/80 backdrop-blur-xl border border-white dark:bg-zinc-900/50 dark:border-zinc-800 rounded-3xl p-8 shadow-2xl shadow-zinc-200/50 dark:shadow-none space-y-8 h-fit lg:sticky lg:top-12">
          <div>
            <h1 className="text-3xl font-black tracking-tight mb-2">Spin the Wheel</h1>
            <p className="text-zinc-500 dark:text-zinc-400">Add names and spin to decide your fate.</p>
          </div>

          <div className="flex items-center gap-3 p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-100 dark:border-zinc-800">
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                checked={removeAfterSelection}
                onChange={(e) => setRemoveAfterSelection(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-zinc-200 peer-focus:outline-none rounded-full peer dark:bg-zinc-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-rose-500"></div>
            </label>
            <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Remove name after selection</span>
          </div>

          <form onSubmit={addName} className="flex gap-2">
            <div className="relative flex-1">
              <UserPlus className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Enter a name..."
                className="w-full pl-12 pr-4 py-4 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-rose-500/20 transition-all"
              />
            </div>
            <button 
              type="submit"
              className="px-6 bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 rounded-2xl font-bold hover:scale-105 active:scale-95 transition-all"
            >
              Add
            </button>
          </form>

          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-lg">Names ({names.length})</h3>
              <button 
                onClick={() => setNames([])}
                className="text-sm text-zinc-400 hover:text-rose-500 transition-colors flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" /> Clear all
              </button>
            </div>
            
            <div className="flex flex-wrap gap-2 max-h-[400px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-zinc-200">
              {names.map((name, index) => (
                <div 
                  key={index} 
                  className="flex items-center gap-3 p-2 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800 rounded-xl hover:border-zinc-200 dark:hover:border-zinc-700 transition-all group h-fit min-w-max"
                >
                  {editingIndex === index ? (
                    <div className="flex items-center gap-1">
                      <input
                        autoFocus
                        type="text"
                        value={editingValue}
                        onChange={(e) => setEditingValue(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && saveEdit()}
                        className="w-24 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                      />
                      <button onClick={saveEdit} className="p-1 text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 rounded-md">
                        <Check className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <span className="font-medium text-sm px-1">{name}</span>
                      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => startEditing(index)}
                          className="p-1 text-zinc-400 hover:text-indigo-500 rounded-md transition-all"
                        >
                          <Pencil className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => removeName(index)}
                          className="p-1 text-zinc-400 hover:text-rose-500 rounded-md transition-all"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
              {names.length === 0 && (
                <div className="col-span-2 py-12 text-center text-zinc-400">
                  <p>No names added yet.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
