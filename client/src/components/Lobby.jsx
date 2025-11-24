import { Users, Copy, Check, Play, LogOut } from 'lucide-react';
import { useState } from 'react';

function Lobby({ roomData, isHost, onStartGame, onLeave }) {
  const [copied, setCopied] = useState(false);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(roomData.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-500 rounded-xl mb-4">
            <Users className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-4">Waiting Room</h1>

          {/* Room Code Display */}
          <div className="inline-flex items-center gap-3 bg-slate-800 border-2 border-slate-700 rounded-xl px-6 py-4">
            <div className="text-left">
              <p className="text-sm text-slate-400 mb-1">Room Code</p>
              <p className="text-3xl font-bold text-white font-mono tracking-wider">
                {roomData.id}
              </p>
            </div>
            <button
              onClick={handleCopyCode}
              className="p-3 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
              title="Copy room code"
            >
              {copied ? (
                <Check className="w-5 h-5 text-green-400" />
              ) : (
                <Copy className="w-5 h-5 text-slate-300" />
              )}
            </button>
          </div>

          {isHost && (
            <p className="text-purple-400 mt-4 text-sm font-medium">
              You are the host
            </p>
          )}
        </div>

        {/* Players List */}
        <div className="bg-slate-800 border-2 border-slate-700 rounded-2xl p-6 mb-6">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <Users className="w-5 h-5" />
            Players ({roomData.players.length})
          </h2>

          <div className="space-y-2">
            {roomData.players.map((player, index) => (
              <div
                key={player.socketId}
                className="flex items-center gap-3 bg-slate-700/50 rounded-lg px-4 py-3"
              >
                <div className={`w-10 h-10 rounded-full ${
                  player.socketId === roomData.host
                    ? 'bg-purple-500'
                    : 'bg-slate-600'
                } flex items-center justify-center text-white font-bold`}>
                  {player.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1">
                  <p className="text-white font-medium">{player.name}</p>
                  {player.socketId === roomData.host && (
                    <p className="text-xs text-purple-400">Host</p>
                  )}
                </div>
                <div className="w-2 h-2 bg-green-400 rounded-full" title="Online" />
              </div>
            ))}
          </div>

          {roomData.players.length < 2 && (
            <div className="mt-4 p-4 bg-slate-900/50 border border-slate-600 rounded-lg">
              <p className="text-slate-400 text-sm text-center">
                Waiting for more players to join...
              </p>
            </div>
          )}
        </div>

        {/* Question Range Info */}
        {roomData.questionRange && (
          <div className="bg-blue-500/10 border-2 border-blue-500/30 rounded-xl p-6 mb-6">
            <h3 className="text-lg font-bold text-blue-400 mb-3 flex items-center gap-2">
              📚 Practice Session
            </h3>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-sm text-slate-400 mb-1">Start</p>
                <p className="text-2xl font-bold text-white">#{roomData.questionRange.start}</p>
              </div>
              <div>
                <p className="text-sm text-slate-400 mb-1">End</p>
                <p className="text-2xl font-bold text-white">#{roomData.questionRange.end}</p>
              </div>
              <div>
                <p className="text-sm text-slate-400 mb-1">Total</p>
                <p className="text-2xl font-bold text-blue-400">{roomData.questionRange.total}</p>
              </div>
            </div>
            <p className="text-sm text-slate-400 mt-4 text-center">
              Questions {roomData.questionRange.start} through {roomData.questionRange.end}
            </p>
          </div>
        )}

        {/* Instructions */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 mb-6">
          <h3 className="text-lg font-bold text-white mb-3">How it works</h3>
          <ul className="space-y-2 text-slate-300 text-sm">
            <li className="flex items-start gap-2">
              <span className="text-blue-400 mt-0.5">•</span>
              <span>Answer questions together as a team</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-400 mt-0.5">•</span>
              <span>You have 60 seconds to vote on each question</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-400 mt-0.5">•</span>
              <span>See what the group voted and compare with correct answer</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-400 mt-0.5">•</span>
              <span>Learn together from explanations</span>
            </li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4">
          <button
            onClick={onLeave}
            className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-medium transition-colors flex items-center gap-2"
          >
            <LogOut className="w-5 h-5" />
            Leave Room
          </button>

          {isHost && (
            <button
              onClick={onStartGame}
              disabled={roomData.players.length < 1}
              className="flex-1 px-6 py-4 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white rounded-xl font-bold text-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 shadow-lg hover:shadow-purple-500/50"
            >
              <Play className="w-6 h-6" />
              Start Exam
            </button>
          )}

          {!isHost && (
            <div className="flex-1 px-6 py-4 bg-slate-700/50 border border-slate-600 text-slate-400 rounded-xl font-medium text-center">
              Waiting for host to start...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Lobby;
