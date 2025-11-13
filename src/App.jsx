import React, { useState, useRef, useEffect } from 'react';
import {
  Save,
  Upload,
  Plus,
  Trash2,
  User,
  XCircle,
  ChevronDown,
  ChevronUp,
  RotateCw,
  Image,
  Undo2,
  Redo2,
  Maximize2,
  Minimize2,
  ZoomIn,
  ZoomOut,
  LayoutTemplate,
  Move,
  Clock,
  FileText,
  Lightbulb,
  Smile,
} from 'lucide-react';

// Dimensiones del "mundo" (zona donde pueden moverse los miembros)
const WORLD_WIDTH = 2000;
const WORLD_HEIGHT = 2000;

// Helper para canvas nítido en pantallas HiDPI
const setupHiDPICanvas = (canvas, cssWidth, cssHeight) => {
  const dpr = window.devicePixelRatio || 1;
  canvas.width = Math.floor(cssWidth * dpr);
  canvas.height = Math.floor(cssHeight * dpr);
  canvas.style.width = `${cssWidth}px`;
  canvas.style.height = `${cssHeight}px`;
  const ctx = canvas.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return ctx;
};

// Utilidad para normalizar ángulos
const normAngle = (a) => ((a % 360) + 360) % 360;

// Utilidad para snap a cuadrícula
const GRID = 50;
const snap = (v, strength = 0.35) => {
  const target = Math.round(v / GRID) * GRID;
  return v + (target - v) * strength;
};

// Emociones disponibles
const EMOTIONS = [
  { emoji: '😊', name: 'Alegría', color: '#FDE047' },
  { emoji: '😢', name: 'Tristeza', color: '#60A5FA' },
  { emoji: '😠', name: 'Enfado', color: '#F87171' },
  { emoji: '😰', name: 'Miedo', color: '#A78BFA' },
  { emoji: '😐', name: 'Neutral', color: '#9CA3AF' },
  { emoji: '🤗', name: 'Amor', color: '#FB7185' },
  { emoji: '😔', name: 'Culpa', color: '#CBD5E1' },
  { emoji: '😌', name: 'Paz', color: '#86EFAC' },
  { emoji: '😤', name: 'Frustración', color: '#FDBA74' },
  { emoji: '🥺', name: 'Vulnerabilidad', color: '#C4B5FD' },
];

// Patrones comunes en constelaciones
const COMMON_PATTERNS = [
  {
    name: 'Triangulación',
    description: 'Cuando un hijo se coloca entre dos padres en conflicto, actuando como mediador o aliado de uno contra el otro.',
    indicators: ['Hijo entre padres', 'Vínculos cruzados', 'Lealtad dividida'],
  },
  {
    name: 'Parentificación',
    description: 'Un hijo asume roles y responsabilidades de adulto, cuidando de sus padres o hermanos de forma inapropiada para su edad.',
    indicators: ['Hijo en posición parental', 'Vínculos invertidos', 'Exceso de responsabilidad'],
  },
  {
    name: 'Exclusión sistémica',
    description: 'Cuando un miembro de la familia es olvidado, negado o separado del sistema familiar.',
    indicators: ['Miembro aislado', 'Sin vínculos', 'Distancia física extrema'],
  },
  {
    name: 'Coalición',
    description: 'Alianza entre dos miembros contra un tercero, creando desequilibrios en el sistema familiar.',
    indicators: ['Vínculo fuerte entre dos', 'Conflicto con tercero', 'Exclusión de uno'],
  },
  {
    name: 'Lealtades invisibles',
    description: 'Compromisos no reconocidos que mantienen a los miembros atados a patrones familiares del pasado.',
    indicators: ['Repetición de patrones', 'Comportamientos inexplicables', 'Dificultad para diferenciarse'],
  },
];

// Componente del dial de rotación
const RotationDial = ({ rotation, onChange }) => {
  const [isDragging, setIsDragging] = useState(false);
  const dialRef = useRef(null);

  const updateRotation = (clientX, clientY) => {
    if (!dialRef.current) return;
    const rect = dialRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const dx = clientX - centerX;
    const dy = clientY - centerY;
    const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
    onChange(normAngle(angle));
  };

  const handleMouseDown = (e) => {
    setIsDragging(true);
    updateRotation(e.clientX, e.clientY);
  };

  const handleMouseMove = (e) => {
    if (isDragging) {
      updateRotation(e.clientX, e.clientY);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (e) => {
    e.preventDefault();
    setIsDragging(true);
    const t = e.touches[0];
    updateRotation(t.clientX, t.clientY);
  };

  const handleTouchMove = (e) => {
    e.preventDefault();
    if (!isDragging) return;
    const t = e.touches[0];
    updateRotation(t.clientX, t.clientY);
  };

  const handleTouchEnd = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging]);

  return (
    <div className="flex flex-col items-center gap-2">
      <div
        ref={dialRef}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className="relative w-24 h-24 bg-gray-100 rounded-full border-2 border-gray-300 cursor-pointer hover:border-purple-400 transition"
        style={{ touchAction: 'none' }}
      >
        <div className="absolute top-1/2 left-1/2 w-3 h-3 bg-gray-400 rounded-full transform -translate-x-1/2 -translate-y-1/2 z-10" />
        <div
          className="absolute top-1/2 left-1/2 origin-left"
          style={{
            transform: `translate(-50%, -50%) rotate(${rotation}deg)`,
            transition: isDragging ? 'none' : 'transform 0.1s ease',
          }}
        >
          <div className="w-9 h-0.5 bg-purple-600" />
          <div
            className="absolute right-0 top-1/2 transform -translate-y-1/2"
            style={{
              width: 0,
              height: 0,
              borderLeft: '6px solid #9333EA',
              borderTop: '4px solid transparent',
              borderBottom: '4px solid transparent',
            }}
          />
        </div>
      </div>
      <span className="text-xs font-mono text-gray-600">{Math.round(rotation)}°</span>
    </div>
  );
};

// Modal para añadir miembro rápido
const QuickAddModal = ({ position, onAdd, onClose, generations }) => {
  const [name, setName] = useState('');
  const [generation, setGeneration] = useState(3);
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleCreate = () => {
    if (name.trim()) {
      onAdd(name, generation);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && name.trim()) {
      handleCreate();
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-20 z-40" onClick={onClose} />
      <div
        className="fixed bg-white rounded-xl shadow-2xl p-6 z-50 border-2 border-purple-200"
        onClick={(e) => e.stopPropagation()}
        style={{
          left: `${position.x}px`,
          top: `${position.y}px`,
          transform: 'translate(-50%, -50%)',
          minWidth: '280px',
        }}
      >
        <h3 className="text-lg font-bold text-gray-800 mb-4">Nuevo miembro</h3>
        <div className="space-y-3">
          <div>
            <input
              ref={inputRef}
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Nombre (requerido)"
              className={`w-full px-3 py-2 border-2 rounded-lg focus:ring-2 focus:ring-purple-200 outline-none ${
                name.trim()
                  ? 'border-gray-300 focus:border-purple-500'
                  : 'border-red-300 focus:border-red-500'
              }`}
            />
            {!name.trim() && <p className="text-xs text-red-600 mt-1">* Escribe un nombre para continuar</p>}
          </div>
          <select
            value={generation}
            onChange={(e) => setGeneration(parseInt(e.target.value))}
            className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-purple-500 outline-none"
          >
            {generations.map((gen) => (
              <option key={gen.value} value={gen.value}>
                {gen.label}
              </option>
            ))}
          </select>
          <div className="flex gap-2">
            <button
              onClick={handleCreate}
              disabled={!name.trim()}
              className={`flex-1 px-4 py-2 rounded-lg transition font-semibold ${
                name.trim()
                  ? 'bg-purple-600 text-white hover:bg-purple-700 cursor-pointer'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              Crear
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

// Menú contextual para miembros
const MemberContextMenu = ({ position, member, onAction, onClose }) => {
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const actions = [
    { icon: '✏️', label: 'Editar información', action: 'edit' },
    { icon: '🎯', label: 'Cambiar dirección', action: 'rotate' },
    { icon: '🎨', label: 'Cambiar color', action: 'color' },
    { icon: '😊', label: 'Cambiar emoción', action: 'emotion' },
    { icon: '🔗', label: 'Crear vínculo', action: 'connect' },
    { icon: '🗑️', label: 'Eliminar', action: 'delete', danger: true },
  ];

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div
        ref={menuRef}
        className="fixed bg-white rounded-xl shadow-2xl py-2 z-50 border border-gray-200"
        style={{ left: `${position.x}px`, top: `${position.y}px`, minWidth: '200px' }}
      >
        <div className="px-4 py-2 border-b border-gray-100">
          <div className="flex items-center gap-2">
            {member.emotion && (
              <span className="text-2xl">{member.emotion}</span>
            )}
            <div>
              <p className="font-semibold text-gray-800 truncate">{member.name}</p>
              {member.role && <p className="text-xs text-gray-500">{member.role}</p>}
            </div>
          </div>
        </div>
        {actions.map((act, idx) => (
          <button
            key={idx}
            onClick={() => {
              onAction(act.action);
              onClose();
            }}
            className={`w-full px-4 py-2 text-left hover:bg-gray-50 transition flex items-center gap-3 ${
              act.danger ? 'text-red-600 hover:bg-red-50' : 'text-gray-700'
            }`}
          >
            <span className="text-lg">{act.icon}</span>
            <span className="text-sm font-medium">{act.label}</span>
          </button>
        ))}
      </div>
    </>
  );
};

// Modal para editar nombre y datos
const EditNameModal = ({ member, onSave, onClose }) => {
  const [name, setName] = useState(member.name);
  const [role, setRole] = useState(member.role || '');
  const [notes, setNotes] = useState(member.notes || '');
  const inputRef = useRef(null);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, []);

  const handleSave = () => {
    if (name.trim()) {
      onSave(name, role, notes);
      onClose();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey && name.trim()) {
      handleSave();
    }
  };

  return (
    <>
      <div
        className="fixed inset-0 bg-black bg-opacity-30 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      />
      <div
        className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-xl shadow-2xl p-6 z-50 border-2 border-purple-200 w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-xl font-bold text-gray-800 mb-4">Editar miembro</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
            <input
              ref={inputRef}
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Rol (opcional)</label>
            <input
              type="text"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ej: Madre, Hijo mayor..."
              className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notas personales</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Observaciones sobre este miembro..."
              className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none"
              rows={3}
            />
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleSave}
              className="flex-1 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition font-semibold"
            >
              Guardar
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

// Modal selector de color
const ColorPickerModal = ({ member, onSelectColor, onClose }) => {
  const colors = [
    { hex: '#3B82F6', name: 'Azul' },
    { hex: '#10B981', name: 'Verde' },
    { hex: '#F59E0B', name: 'Naranja' },
    { hex: '#EF4444', name: 'Rojo' },
    { hex: '#9333EA', name: 'Púrpura' },
    { hex: '#EC4899', name: 'Rosa' },
    { hex: '#6B7280', name: 'Gris' },
    { hex: '#14B8A6', name: 'Turquesa' },
  ];

  return (
    <>
      <div
        className="fixed inset-0 bg-black bg-opacity-30 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      />
      <div
        className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-xl shadow-2xl p-6 z-50 border-2 border-purple-200"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-xl font-bold text-gray-800 mb-4">Elige un color</h3>
        <div className="grid grid-cols-4 gap-3 mb-4">
          {colors.map((color) => (
            <button
              key={color.hex}
              onClick={() => {
                onSelectColor(color.hex);
                onClose();
              }}
              className={`w-16 h-16 rounded-xl border-4 transition-all hover:scale-110 ${
                member.color === color.hex ? 'border-gray-800 scale-105' : 'border-gray-200'
              }`}
              style={{ backgroundColor: color.hex }}
              title={color.name}
            />
          ))}
        </div>
        <button
          onClick={onClose}
          className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
        >
          Cancelar
        </button>
      </div>
    </>
  );
};

// Modal selector de emoción
const EmotionPickerModal = ({ member, onSelectEmotion, onClose }) => {
  return (
    <>
      <div
        className="fixed inset-0 bg-black bg-opacity-30 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      />
      <div
        className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-xl shadow-2xl p-6 z-50 border-2 border-purple-200 max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-xl font-bold text-gray-800 mb-4">Emoción predominante</h3>
        <p className="text-sm text-gray-600 mb-4">
          Selecciona la emoción que mejor representa el estado de {member.name}
        </p>
        <div className="grid grid-cols-2 gap-3 mb-4 max-h-96 overflow-y-auto">
          {EMOTIONS.map((emotion) => (
            <button
              key={emotion.name}
              onClick={() => {
                onSelectEmotion(emotion.emoji);
                onClose();
              }}
              className={`p-4 rounded-xl border-2 transition-all hover:scale-105 ${
                member.emotion === emotion.emoji
                  ? 'border-purple-600 bg-purple-50 scale-105'
                  : 'border-gray-200 hover:border-purple-300'
              }`}
              style={{ borderColor: member.emotion === emotion.emoji ? emotion.color : undefined }}
            >
              <div className="text-4xl mb-2">{emotion.emoji}</div>
              <div className="text-sm font-semibold text-gray-800">{emotion.name}</div>
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => {
              onSelectEmotion(null);
              onClose();
            }}
            className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition text-sm"
          >
            Sin emoción
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition text-sm"
          >
            Cancelar
          </button>
        </div>
      </div>
    </>
  );
};

// Modal de rotación
const RotationModal = ({ member, onRotate, onClose }) => {
  const [rotation, setRotation] = useState(member.rotation || 0);

  return (
    <>
      <div
        className="fixed inset-0 bg-black bg-opacity-30 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      />
      <div
        className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-xl shadow-2xl p-6 z-50 border-2 border-purple-200"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-xl font-bold text-gray-800 mb-4">Ajustar dirección</h3>
        <div className="flex flex-col items-center gap-4 mb-4">
          <RotationDial rotation={rotation} onChange={setRotation} />
          <p className="text-sm text-gray-600">Arrastra la flecha para girar</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => {
              onRotate(rotation);
              onClose();
            }}
            className="flex-1 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition font-semibold"
          >
            Aplicar
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
          >
            Cancelar
          </button>
        </div>
      </div>
    </>
  );
};

// Modal de patrones educativos
const PatternsModal = ({ onClose }) => {
  return (
    <>
      <div
        className="fixed inset-0 bg-black bg-opacity-30 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      />
      <div
        className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-xl shadow-2xl p-6 z-50 border-2 border-purple-200 w-full max-w-2xl max-h-[80vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 mb-4">
          <Lightbulb className="w-8 h-8 text-amber-500" />
          <h3 className="text-2xl font-bold text-gray-800">Patrones comunes en constelaciones</h3>
        </div>
        <p className="text-sm text-gray-600 mb-6">
          Estos son algunos patrones relacionales que suelen observarse en las dinámicas familiares:
        </p>
        <div className="space-y-4">
          {COMMON_PATTERNS.map((pattern, idx) => (
            <div key={idx} className="bg-gradient-to-r from-purple-50 to-blue-50 p-4 rounded-lg border border-purple-200">
              <h4 className="font-bold text-lg text-gray-800 mb-2">{pattern.name}</h4>
              <p className="text-sm text-gray-700 mb-3">{pattern.description}</p>
              <div className="flex flex-wrap gap-2">
                {pattern.indicators.map((indicator, i) => (
                  <span
                    key={i}
                    className="text-xs bg-white px-3 py-1 rounded-full border border-purple-200 text-gray-700"
                  >
                    • {indicator}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
        <button
          onClick={onClose}
          className="w-full mt-6 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-semibold"
        >
          Cerrar
        </button>
      </div>
    </>
  );
};

// Componente principal
const ConstellationApp = () => {
  const initialMember = {
    id: 1,
    name: 'Persona 1',
    x: 200,
    y: 200,
    generation: 1,
    role: 'Padre/Madre',
    color: '#3B82F6',
    notes: '',
    rotation: 0,
    emotion: null,
  };

  const [members, setMembers] = useState([initialMember]);
  const [connections, setConnections] = useState([]);
  const [selectedMember, setSelectedMember] = useState(null);
  const [draggingMember, setDraggingMember] = useState(null);
  const [connectingFrom, setConnectingFrom] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [quickAddPosition, setQuickAddPosition] = useState(null);
  const [contextMenu, setContextMenu] = useState(null);
  const [sessionNotes, setSessionNotes] = useState('');
  const [constellationName, setConstellationName] = useState('Mi Constelación');
  const [showMembersPanel, setShowMembersPanel] = useState(false);
  const [showDetailsPanel, setShowDetailsPanel] = useState(false);
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });
  const [editingMember, setEditingMember] = useState(null);
  const [colorPickerMember, setColorPickerMember] = useState(null);
  const [emotionPickerMember, setEmotionPickerMember] = useState(null);
  const [rotationModalMember, setRotationModalMember] = useState(null);
  const [showPatternsModal, setShowPatternsModal] = useState(false);

  // Capas temporales
  const [timeLayer, setTimeLayer] = useState('present'); // 'past', 'present', 'future'
  const [timeLayers, setTimeLayers] = useState({
    past: { members: [], connections: [], notes: '' },
    present: { members: [initialMember], connections: [], notes: '' },
    future: { members: [], connections: [], notes: '' },
  });

  // Zoom y pan
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanningMode, setIsPanningMode] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState(null);

  // Modo presentación
  const [presentationMode, setPresentationMode] = useState(false);

  const canvasRef = useRef(null);
  const canvasContainerRef = useRef(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  const [newMember, setNewMember] = useState({
    name: '',
    generation: 3,
    role: '',
    notes: '',
  });

  // Historial deshacer/rehacer
  const [history, setHistory] = useState({ undo: [], redo: [] });

  const generations = [
    { value: 1, label: 'Abuelos/Bisabuelos', color: '#9333EA' },
    { value: 2, label: 'Padres/Tíos', color: '#3B82F6' },
    { value: 3, label: 'Hermanos/Yo', color: '#10B981' },
    { value: 4, label: 'Hijos/Sobrinos', color: '#F59E0B' },
  ];

  const connectionTypes = [
    { type: 'strong', label: 'Vínculo fuerte', color: '#10B981', width: 3 },
    { type: 'weak', label: 'Vínculo débil', color: '#94A3B8', width: 1, dash: [5, 5] },
    { type: 'conflict', label: 'Conflicto', color: '#EF4444', width: 2 },
    { type: 'cut', label: 'Corte/Exclusión', color: '#DC2626', width: 3, dash: [10, 5] },
  ];

  const switchTimeLayer = (layer) => {
    const currentLayerKey = timeLayer;

    setTimeLayers((prev) => {
      const updated = {
        ...prev,
        [currentLayerKey]: {
          members,
          connections,
          notes: sessionNotes,
        },
      };

      const newLayer = updated[layer] || { members: [], connections: [], notes: '' };

      setMembers(newLayer.members || []);
      setConnections(newLayer.connections || []);
      setSessionNotes(newLayer.notes || '');
      setSelectedMember(null);
      setTimeLayer(layer);

      return updated;
    });
  };

  // ---- Historial (undo/redo) ----
  const createSnapshot = () => ({
    constellationName,
    members,
    connections,
    sessionNotes,
    pan,
    zoom,
    timeLayer,
    timeLayers,
  });

  const pushUndo = () => {
    setHistory((h) => ({
      undo: [...h.undo, createSnapshot()],
      redo: [],
    }));
  };

  const handleUndo = () => {
    setHistory((h) => {
      if (h.undo.length === 0) return h;
      const last = h.undo[h.undo.length - 1];
      const rest = h.undo.slice(0, -1);
      const current = createSnapshot();

      setConstellationName(last.constellationName || 'Mi Constelación');
      setMembers(last.members || []);
      setConnections(last.connections || []);
      setSessionNotes(last.sessionNotes || '');
      setPan(last.pan || { x: 0, y: 0 });
      setZoom(last.zoom || 1);
      setTimeLayer(last.timeLayer || 'present');
      setTimeLayers(last.timeLayers || { past: {}, present: {}, future: {} });

      return {
        undo: rest,
        redo: [...h.redo, current],
      };
    });
  };

  const handleRedo = () => {
    setHistory((h) => {
      if (h.redo.length === 0) return h;
      const last = h.redo[h.redo.length - 1];
      const rest = h.redo.slice(0, -1);
      const current = createSnapshot();

      setConstellationName(last.constellationName || 'Mi Constelación');
      setMembers(last.members || []);
      setConnections(last.connections || []);
      setSessionNotes(last.sessionNotes || '');
      setPan(last.pan || { x: 0, y: 0 });
      setZoom(last.zoom || 1);
      setTimeLayer(last.timeLayer || 'present');
      setTimeLayers(last.timeLayers || { past: {}, present: {}, future: {} });

      return {
        undo: [...h.undo, current],
        redo: rest,
      };
    });
  };

  const canUndo = history.undo.length > 0;
  const canRedo = history.redo.length > 0;

  // Ajustar tamaño del canvas
  useEffect(() => {
    const updateCanvasSize = () => {
      if (canvasContainerRef.current) {
        const width = canvasContainerRef.current.clientWidth;
        const baseHeight = presentationMode ? window.innerHeight * 0.75 : window.innerHeight * 0.6;
        const height = Math.min(700, Math.max(400, baseHeight));
        setCanvasSize({ width, height });
      }
    };

    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);
    return () => window.removeEventListener('resize', updateCanvasSize);
  }, [presentationMode]);

  // Dibujar canvas (con zoom y pan)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = setupHiDPICanvas(canvas, canvasSize.width, canvasSize.height);
    ctx.clearRect(0, 0, canvasSize.width, canvasSize.height);

    // Espacio "mundo"
    ctx.save();
    ctx.translate(pan.x, pan.y);
    ctx.scale(zoom, zoom);

    // Grid
    ctx.strokeStyle = '#E5E7EB';
    ctx.lineWidth = 0.5;
    const gridStep = 50;
    const maxGridX = WORLD_WIDTH;
    const maxGridY = WORLD_HEIGHT;
    for (let i = -100; i < maxGridX; i += gridStep) {
      ctx.beginPath();
      ctx.moveTo(i, -100);
      ctx.lineTo(i, maxGridY);
      ctx.stroke();
    }
    for (let i = -100; i < maxGridY; i += gridStep) {
      ctx.beginPath();
      ctx.moveTo(-100, i);
      ctx.lineTo(maxGridX, i);
      ctx.stroke();
    }

    // Conexiones
    connections.forEach((conn) => {
      const from = members.find((m) => m.id === conn.from);
      const to = members.find((m) => m.id === conn.to);
      if (!from || !to) return;

      const connType = connectionTypes.find((ct) => ct.type === conn.type) || connectionTypes[0];

      ctx.beginPath();
      ctx.strokeStyle = connType.color;
      ctx.lineWidth = connType.width;
      if (connType.dash) {
        ctx.setLineDash(connType.dash);
      } else {
        ctx.setLineDash([]);
      }
      ctx.moveTo(from.x, from.y);
      ctx.lineTo(to.x, to.y);
      ctx.stroke();
      ctx.setLineDash([]);
    });

    // Miembros
    members.forEach((member) => {
      ctx.beginPath();
      ctx.arc(member.x, member.y, 30, 0, 2 * Math.PI);
      ctx.fillStyle = member.color;
      ctx.fill();

      // Highlight selección o modo conexión
      if (selectedMember?.id === member.id) {
        ctx.strokeStyle = '#1F2937';
        ctx.lineWidth = 3;
        ctx.stroke();
      } else if (connectingFrom === member.id) {
        ctx.strokeStyle = '#2563EB';
        ctx.lineWidth = 3;
        ctx.setLineDash([6, 4]);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // Flecha
      const rotation = member.rotation || 0;
      const arrowLength = 40;
      const arrowWidth = 12;

      const endX = member.x + Math.cos((rotation * Math.PI) / 180) * arrowLength;
      const endY = member.y + Math.sin((rotation * Math.PI) / 180) * arrowLength;

      ctx.beginPath();
      ctx.strokeStyle = '#1F2937';
      ctx.lineWidth = 3;
      ctx.moveTo(member.x, member.y);
      ctx.lineTo(endX, endY);
      ctx.stroke();

      const angle1 = ((rotation + 150) * Math.PI) / 180;
      const angle2 = ((rotation - 150) * Math.PI) / 180;

      ctx.beginPath();
      ctx.fillStyle = '#1F2937';
      ctx.moveTo(endX, endY);
      ctx.lineTo(
        endX + Math.cos(angle1) * arrowWidth,
        endY + Math.sin(angle1) * arrowWidth
      );
      ctx.lineTo(
        endX + Math.cos(angle2) * arrowWidth,
        endY + Math.sin(angle2) * arrowWidth
      );
      ctx.closePath();
      ctx.fill();

      // Iniciales
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 14px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const initials = member.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .substring(0, 2)
        .toUpperCase();
      ctx.fillText(initials, member.x, member.y);

      // Emoción (si existe)
      if (member.emotion) {
        ctx.font = '20px sans-serif';
        ctx.fillText(member.emotion, member.x + 25, member.y - 25);
      }

      // Nombre
      ctx.fillStyle = '#1F2937';
      ctx.font = '12px sans-serif';
      ctx.fillText(member.name, member.x, member.y + 50);
    });

    ctx.restore();

    // Línea de conexión en progreso (en coordenadas de pantalla)
    if (connectingFrom) {
      const from = members.find((m) => m.id === connectingFrom);
      if (from) {
        const fromScreenX = from.x * zoom + pan.x;
        const fromScreenY = from.y * zoom + pan.y;

        ctx.beginPath();
        ctx.strokeStyle = '#6B7280';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.moveTo(fromScreenX, fromScreenY);
        ctx.lineTo(offset.x, offset.y);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    }
  }, [
    members,
    connections,
    selectedMember,
    connectingFrom,
    offset,
    canvasSize,
    zoom,
    pan,
    connectionTypes,
  ]);

  // Listeners globales para arrastre y pan (mouse + touch)
  useEffect(() => {
    const move = (e) => {
      if (!canvasRef.current) return;

      let clientX;
      let clientY;

      if (e.touches && e.touches[0]) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
        if (e.cancelable) e.preventDefault();
      } else {
        clientX = e.clientX;
        clientY = e.clientY;
      }

      const rect = canvasRef.current.getBoundingClientRect();
      const x = clientX - rect.left;
      const y = clientY - rect.top;
      setOffset({ x, y });

      // Pan
      if (isPanning && panStart) {
        const dx = clientX - panStart.mouseX;
        const dy = clientY - panStart.mouseY;
        setPan({ x: panStart.panX + dx, y: panStart.panY + dy });
        return;
      }

      // Drag de miembro
      if (draggingMember) {
        const canvasX = x;
        const canvasY = y;
        const worldX = (canvasX - pan.x) / zoom;
        const worldY = (canvasY - pan.y) / zoom;

        setMembers((prev) =>
          prev.map((m) =>
            m.id === draggingMember
              ? {
                  ...m,
                  x: Math.max(40, Math.min(snap(worldX), WORLD_WIDTH - 40)),
                  y: Math.max(40, Math.min(snap(worldY), WORLD_HEIGHT - 40)),
                }
              : m
          )
        );
      }
    };

    const up = () => {
      if (draggingMember) {
        const updatedMember = members.find((m) => m.id === draggingMember);
        if (updatedMember) {
          setSelectedMember(updatedMember);
        }
      }
      setDraggingMember(null);
      setIsPanning(false);
      setPanStart(null);
    };

    if (draggingMember !== null || isPanning) {
      window.addEventListener('mousemove', move);
      window.addEventListener('mouseup', up);
      window.addEventListener('touchmove', move, { passive: false });
      window.addEventListener('touchend', up);
      window.addEventListener('touchcancel', up);
      return () => {
        window.removeEventListener('mousemove', move);
        window.removeEventListener('mouseup', up);
        window.removeEventListener('touchmove', move);
        window.removeEventListener('touchend', up);
        window.removeEventListener('touchcancel', up);
      };
    }
  }, [draggingMember, canvasSize.width, canvasSize.height, members, pan, zoom, isPanning, panStart]);

  // Conversión pantalla → mundo
  const screenToWorld = (canvasX, canvasY) => ({
    x: (canvasX - pan.x) / zoom,
    y: (canvasY - pan.y) / zoom,
  });

  const handleCanvasMouseDown = (e) => {
    // Solo clic izquierdo
    if (e.button !== 0) return;

    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const canvasX = e.clientX - rect.left;
    const canvasY = e.clientY - rect.top;
    const { x, y } = screenToWorld(canvasX, canvasY);

    // Modo pan
    if (isPanningMode) {
      setIsPanning(true);
      setPanStart({
        mouseX: e.clientX,
        mouseY: e.clientY,
        panX: pan.x,
        panY: pan.y,
      });
      setContextMenu(null);
      return;
    }

    const clickedMember = members.find((m) => {
      const dist = Math.sqrt(Math.pow(m.x - x, 2) + Math.pow(m.y - y, 2));
      return dist <= 30;
    });

    if (clickedMember) {
      if (connectingFrom) {
        // Crear conexión
        if (connectingFrom !== clickedMember.id) {
          pushUndo();
          setConnections((prev) => [
            ...prev,
            {
              id: Date.now(),
              from: connectingFrom,
              to: clickedMember.id,
              type: 'strong',
            },
          ]);
        }
        setConnectingFrom(null);
      } else {
        // Preparar drag
        pushUndo();
        setSelectedMember(clickedMember);
        setDraggingMember(clickedMember.id);
      }
    } else {
      setSelectedMember(null);
      setConnectingFrom(null);
    }

    setContextMenu(null);
  };

  const handleCanvasDoubleClick = (e) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const canvasX = e.clientX - rect.left;
    const canvasY = e.clientY - rect.top;
    const worldPos = screenToWorld(canvasX, canvasY);

    const clickedMember = members.find((m) => {
      const dist = Math.sqrt(Math.pow(m.x - worldPos.x, 2) + Math.pow(m.y - worldPos.y, 2));
      return dist <= 30;
    });

    if (!clickedMember) {
      setQuickAddPosition({
        screenX: e.clientX,
        screenY: e.clientY,
        worldX: worldPos.x,
        worldY: worldPos.y,
      });
    }
  };

  const handleCanvasContextMenu = (e) => {
    e.preventDefault();
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const canvasX = e.clientX - rect.left;
    const canvasY = e.clientY - rect.top;
    const { x, y } = screenToWorld(canvasX, canvasY);

    const clickedMember = members.find((m) => {
      const dist = Math.sqrt(Math.pow(m.x - x, 2) + Math.pow(m.y - y, 2));
      return dist <= 30;
    });

    if (clickedMember) {
      setSelectedMember(clickedMember);
      setContextMenu({
        type: 'member',
        x: e.clientX,
        y: e.clientY,
        member: clickedMember,
      });
    } else {
      setQuickAddPosition({
        screenX: e.clientX,
        screenY: e.clientY,
        worldX: x,
        worldY: y,
      });
    }
  };

  const handleCanvasMouseMove = (e) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setOffset({ x, y });
  };

  // Touch handlers para el canvas
  const getPos = (e) => {
    if (!canvasRef.current) return { x: 0, y: 0 };
    const rect = canvasRef.current.getBoundingClientRect();
    const p = e.touches ? e.touches[0] : e;
    return { x: p.clientX - rect.left, y: p.clientY - rect.top };
  };

  const handleTouchStart = (e) => {
    const { x, y } = getPos(e);
    const fakeEvent = { button: 0, clientX: e.touches[0].clientX, clientY: e.touches[0].clientY };
    handleCanvasMouseDown(fakeEvent);
    setOffset({ x, y });
  };

  const handleTouchMove = (e) => {
    e.preventDefault();
    const { x, y } = getPos(e);
    setOffset({ x, y });
    // El movimiento real (drag/pan) se gestiona en el listener global de touchmove
  };

  const handleTouchEnd = () => {
    // El drag/pan se suelta en los listeners globales
  };

  const addMember = () => {
    if (!newMember.name.trim()) return;

    pushUndo();

    const genColor = generations.find((g) => g.value === newMember.generation)?.color || '#3B82F6';
    const newId = Math.max(...members.map((m) => m.id), 0) + 1;

    setMembers((prev) => [
      ...prev,
      {
        id: newId,
        name: newMember.name,
        x: canvasSize.width / 2,
        y: canvasSize.height / 2,
        generation: newMember.generation,
        role: newMember.role,
        color: genColor,
        notes: newMember.notes,
        rotation: 0,
        emotion: null,
      },
    ]);

    setNewMember({ name: '', generation: 3, role: '', notes: '' });
    setShowAddForm(false);
  };

  const quickAddMember = (name, generation) => {
    if (!quickAddPosition) return;

    pushUndo();

    const worldX = quickAddPosition.worldX;
    const worldY = quickAddPosition.worldY;

    const genColor = generations.find((g) => g.value === generation)?.color || '#3B82F6';
    const newId = Math.max(...members.map((m) => m.id), 0) + 1;

    const newMemberObj = {
      id: newId,
      name,
      x: Math.max(40, Math.min(worldX, WORLD_WIDTH - 40)),
      y: Math.max(40, Math.min(worldY, WORLD_HEIGHT - 40)),
      generation,
      role: '',
      color: genColor,
      notes: '',
      rotation: 0,
      emotion: null,
    };

    setMembers((prev) => [...prev, newMemberObj]);
  };

  const handleContextMenuAction = (action) => {
    if (!selectedMember) return;

    switch (action) {
      case 'edit':
        setEditingMember(selectedMember);
        break;
      case 'rotate':
        setRotationModalMember(selectedMember);
        break;
      case 'color':
        setColorPickerMember(selectedMember);
        break;
      case 'emotion':
        setEmotionPickerMember(selectedMember);
        break;
      case 'connect':
        setConnectingFrom(selectedMember.id);
        break;
      case 'delete':
        if (confirm(`¿Eliminar a ${selectedMember.name}?`)) {
          pushUndo();
          setMembers((prev) => prev.filter((m) => m.id !== selectedMember.id));
          setConnections((prev) =>
            prev.filter((c) => c.from !== selectedMember.id && c.to !== selectedMember.id)
          );
          setSelectedMember(null);
        }
        break;
      default:
        break;
    }
  };

  const handleEditMember = (name, role, notes) => {
    if (!editingMember) return;
    pushUndo();
    setMembers((prev) =>
      prev.map((m) => (m.id === editingMember.id ? { ...m, name, role, notes } : m))
    );
    if (selectedMember?.id === editingMember.id) {
      setSelectedMember({ ...editingMember, name, role, notes });
    }
  };

  const updateMemberColor = (color) => {
    const targetMember = colorPickerMember || selectedMember;
    if (!targetMember) return;
    pushUndo();
    setMembers((prev) =>
      prev.map((m) => (m.id === targetMember.id ? { ...m, color } : m))
    );
    if (selectedMember?.id === targetMember.id) {
      setSelectedMember((prev) => ({ ...prev, color }));
    }
  };

  const updateMemberEmotion = (emotion) => {
    const targetMember = emotionPickerMember || selectedMember;
    if (!targetMember) return;
    pushUndo();
    setMembers((prev) =>
      prev.map((m) => (m.id === targetMember.id ? { ...m, emotion } : m))
    );
    if (selectedMember?.id === targetMember.id) {
      setSelectedMember((prev) => ({ ...prev, emotion }));
    }
  };

  const updateMemberRotation = (rotation, { skipHistory = false } = {}) => {
    const targetMember = rotationModalMember || selectedMember;
    if (!targetMember) return;
    const rot = normAngle(rotation);
    if (!skipHistory) pushUndo();
    setMembers((prev) =>
      prev.map((m) => (m.id === targetMember.id ? { ...m, rotation: rot } : m))
    );
    if (selectedMember?.id === targetMember.id) {
      setSelectedMember((prev) => ({ ...prev, rotation: rot }));
    }
  };

  const deleteConnection = (connId) => {
    pushUndo();
    setConnections((prev) => prev.filter((c) => c.id !== connId));
  };

  const updateConnectionType = (connId, type) => {
    pushUndo();
    setConnections((prev) =>
      prev.map((c) => (c.id === connId ? { ...c, type } : c))
    );
  };

  const saveConstellation = () => {
    // Guardar todas las capas antes de exportar
    const allLayers = {
      ...timeLayers,
      [timeLayer]: { members, connections, notes: sessionNotes },
    };

    const data = {
      name: constellationName,
      date: new Date().toISOString(),
      timeLayers: allLayers,
      currentLayer: timeLayer,
      pan,
      zoom,
      sessionMeta: {
        createdAt: new Date().toLocaleString(),
      },
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `constelacion-${constellationName.replace(/\s+/g, '-')}-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportSummary = () => {
    // Generar resumen textual
    const allLayers = {
      ...timeLayers,
      [timeLayer]: { members, connections, notes: sessionNotes },
    };

    let summary = `# ${constellationName}\n`;
    summary += `Fecha: ${new Date().toLocaleString()}\n\n`;

    ['past', 'present', 'future'].forEach((layer) => {
      const layerName = layer === 'past' ? 'PASADO' : layer === 'present' ? 'PRESENTE' : 'FUTURO';
      const layerData = allLayers[layer];

      if (!layerData || (!layerData.members?.length && !layerData.notes)) return;

      summary += `## ${layerName}\n\n`;

      if (layerData.members && layerData.members.length > 0) {
        summary += `### Miembros (${layerData.members.length})\n\n`;
        layerData.members.forEach((m) => {
          const gen = generations.find((g) => g.value === m.generation);
          summary += `**${m.name}**\n`;
          if (m.role) summary += `- Rol: ${m.role}\n`;
          if (gen) summary += `- Generación: ${gen.label}\n`;
          if (m.emotion) {
            const emotionData = EMOTIONS.find((e) => e.emoji === m.emotion);
            summary += `- Emoción: ${m.emotion} ${emotionData?.name || ''}\n`;
          }
          summary += `- Dirección: ${Math.round(m.rotation || 0)}°\n`;
          if (m.notes) summary += `- Notas: ${m.notes}\n`;
          summary += '\n';
        });
      }

      if (layerData.connections && layerData.connections.length > 0) {
        summary += `### Vínculos (${layerData.connections.length})\n\n`;
        layerData.connections.forEach((conn) => {
          const from = layerData.members.find((m) => m.id === conn.from);
          const to = layerData.members.find((m) => m.id === conn.to);
          const connType = connectionTypes.find((ct) => ct.type === conn.type);
          if (from && to && connType) {
            summary += `- ${from.name} → ${to.name}: ${connType.label}\n`;
          }
        });
        summary += '\n';
      }

      if (layerData.notes) {
        summary += `### Notas\n\n${layerData.notes}\n\n`;
      }

      summary += '---\n\n';
    });

    // Añadir patrones identificados
    summary += '## Patrones a considerar\n\n';
    COMMON_PATTERNS.forEach((pattern) => {
      summary += `### ${pattern.name}\n${pattern.description}\n\n`;
    });

    const blob = new Blob([summary], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `resumen-${constellationName.replace(/\s+/g, '-')}-${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const loadConstellation = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target.result);

        // Retrocompatibilidad: si el archivo antiguo no tiene capas temporales
        if (!data.timeLayers) {
          setConstellationName(data.name || 'Constelación cargada');
          setMembers(data.members || []);
          setConnections(data.connections || []);
          setSessionNotes(data.sessionNotes || '');
          if (data.pan) setPan(data.pan);
          if (typeof data.zoom === 'number') setZoom(data.zoom);
          setTimeLayer('present');
          setTimeLayers({
            past: { members: [], connections: [], notes: '' },
            present: { members: data.members || [], connections: data.connections || [], notes: data.sessionNotes || '' },
            future: { members: [], connections: [], notes: '' },
          });
        } else {
          // Nuevo formato con capas
          setConstellationName(data.name || 'Constelación cargada');
          setTimeLayers(data.timeLayers);
          const currentLayerKey = data.currentLayer || 'present';
          setTimeLayer(currentLayerKey);
          const currentLayerData = data.timeLayers[currentLayerKey] || {};
          setMembers(currentLayerData.members || []);
          setConnections(currentLayerData.connections || []);
          setSessionNotes(currentLayerData.notes || '');
          if (data.pan) setPan(data.pan);
          if (typeof data.zoom === 'number') setZoom(data.zoom);
        }

        setHistory({ undo: [], redo: [] });
      } catch (error) {
        alert('Error al cargar el archivo');
      }
    };
    reader.readAsText(file);
  };

  const clearCanvas = () => {
    if (confirm('¿Seguro que quieres limpiar toda la constelación?')) {
      pushUndo();
      setMembers([]);
      setConnections([]);
      setSelectedMember(null);
      setSessionNotes('');
      setPan({ x: 0, y: 0 });
      setZoom(1);
    }
  };

  const exportPNG = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const url = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = `constelacion-${constellationName.replace(/\s+/g, '-')}-${timeLayer}.png`;
    a.click();
  };

  // Plantilla familia base
  const applyFamilyTemplate = () => {
    if (!confirm('Esto reemplazará los miembros actuales por una plantilla base. ¿Continuar?')) {
      return;
    }
    pushUndo();
    const centerX = canvasSize.width / 2;
    const centerY = canvasSize.height / 2;

    const templateMembers = [
      {
        id: 1,
        name: 'Madre',
        x: centerX - 80,
        y: centerY - 50,
        generation: 2,
        role: 'Madre',
        color: '#3B82F6',
        notes: '',
        rotation: 90,
        emotion: null,
      },
      {
        id: 2,
        name: 'Padre',
        x: centerX + 80,
        y: centerY - 50,
        generation: 2,
        role: 'Padre',
        color: '#9333EA',
        notes: '',
        rotation: 90,
        emotion: null,
      },
      {
        id: 3,
        name: 'Hijo',
        x: centerX - 80,
        y: centerY + 70,
        generation: 3,
        role: 'Hijo',
        color: '#10B981',
        notes: '',
        rotation: -90,
        emotion: null,
      },
      {
        id: 4,
        name: 'Hija',
        x: centerX + 80,
        y: centerY + 70,
        generation: 3,
        role: 'Hija',
        color: '#F59E0B',
        notes: '',
        rotation: -90,
        emotion: null,
      },
    ];

    const templateConnections = [
      { id: 1001, from: 1, to: 2, type: 'strong' },
      { id: 1002, from: 1, to: 3, type: 'strong' },
      { id: 1003, from: 2, to: 4, type: 'strong' },
      { id: 1004, from: 3, to: 4, type: 'weak' },
    ];

    setMembers(templateMembers);
    setConnections(templateConnections);
    setSelectedMember(null);
    setPan({ x: 0, y: 0 });
    setZoom(1);
  };

  // Autosave en localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem('constellationDraft');
      if (raw) {
        const data = JSON.parse(raw);
        setConstellationName(data.name ?? 'Mi Constelación');
        setTimeLayers(data.timeLayers ?? { past: {}, present: {}, future: {} });
        const currentLayerKey = data.currentLayer ?? 'present';
        setTimeLayer(currentLayerKey);
        const layer = data.timeLayers?.[currentLayerKey];
        setMembers(layer?.members ?? []);
        setConnections(layer?.connections ?? []);
        setSessionNotes(layer?.notes ?? '');
        if (data.pan) setPan(data.pan);
        if (typeof data.zoom === 'number') setZoom(data.zoom);
      }
    } catch {
      // ignorar errores de lectura
    }
  }, []);

  useEffect(() => {
    const id = setTimeout(() => {
      const allLayers = {
        ...timeLayers,
        [timeLayer]: { members, connections, notes: sessionNotes },
      };
      try {
        localStorage.setItem(
          'constellationDraft',
          JSON.stringify({
            name: constellationName,
            timeLayers: allLayers,
            currentLayer: timeLayer,
            pan,
            zoom,
          })
        );
      } catch {
        // ignorar errores de escritura
      }
    }, 400);
    return () => clearTimeout(id);
  }, [constellationName, members, connections, sessionNotes, pan, zoom, timeLayer, timeLayers]);

  // Atajos de teclado
  useEffect(() => {
    const onKey = (e) => {
      if (!selectedMember) return;
      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        if (confirm(`¿Eliminar a ${selectedMember.name}?`)) {
          pushUndo();
          setMembers((ms) => ms.filter((m) => m.id !== selectedMember.id));
          setConnections((cs) =>
            cs.filter((c) => c.from !== selectedMember.id && c.to !== selectedMember.id)
          );
          setSelectedMember(null);
        }
      } else if (e.key.toLowerCase() === 'r' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        setRotationModalMember(selectedMember);
      } else if (e.key.toLowerCase() === 'c' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        setConnectingFrom(selectedMember.id);
      } else if (e.key.toLowerCase() === 'e' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        setEditingMember(selectedMember);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selectedMember]);

  // Rotación con rueda del ratón
  useEffect(() => {
    const onWheel = (e) => {
      if (!canvasRef.current) return;

      const rect = canvasRef.current.getBoundingClientRect();
      const isOverCanvas =
        e.clientX >= rect.left &&
        e.clientX <= rect.right &&
        e.clientY >= rect.top &&
        e.clientY <= rect.bottom;

      // CTRL + rueda → zoom
      if (isOverCanvas && e.ctrlKey) {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -0.1 : 0.1;
        setZoom((z) => {
          const minZoom = 0.5;
          const maxZoom = 2.5;
          return Math.min(maxZoom, Math.max(minZoom, z + delta));
        });
        return;
      }

      // Rotar miembro seleccionado
      if (!selectedMember || !isOverCanvas) return;

      e.preventDefault();
      const rotationChange = e.deltaY > 0 ? 5 : -5;
      const currentRotation = selectedMember.rotation || 0;
      const newRotation = normAngle(currentRotation + rotationChange);

      updateMemberRotation(newRotation, { skipHistory: true });
    };

    window.addEventListener('wheel', onWheel, { passive: false });
    return () => window.removeEventListener('wheel', onWheel);
  }, [selectedMember]);

  const handleZoomButton = (delta) => {
    const minZoom = 0.5;
    const maxZoom = 2.5;
    setZoom((z) => Math.min(maxZoom, Math.max(minZoom, z + delta)));
  };

  const timeLayerLabels = {
    past: 'Pasado',
    present: 'Presente',
    future: 'Futuro',
  };

  // Conexiones ordenadas: primero las del miembro seleccionado
  const sortedConnections = React.useMemo(() => {
    if (!selectedMember) return connections;
    return [...connections].sort((a, b) => {
      const aInvolved = a.from === selectedMember.id || a.to === selectedMember.id;
      const bInvolved = b.from === selectedMember.id || b.to === selectedMember.id;
      if (aInvolved === bInvolved) return 0;
      return aInvolved ? -1 : 1;
    });
  }, [connections, selectedMember]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-2 sm:p-4 lg:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-3 sm:p-4 lg:p-6 mb-3 sm:mb-4 lg:mb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 mb-3 sm:mb-4">
            <div className="flex items-center gap-2 sm:gap-4 w-full sm:flex-1">
              <User className="w-6 h-6 sm:w-8 sm:h-8 text-purple-600 flex-shrink-0" />
              <input
                type="text"
                value={constellationName}
                onChange={(e) => setConstellationName(e.target.value)}
                className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-800 border-b-2 border-transparent hover:border-purple-300 focus:border-purple-600 outline-none px-2 flex-1 min-w-0"
                placeholder="Nombre"
              />
            </div>

            {/* Selector de capa temporal */}
            <div className="flex items-center gap-2 bg-gradient-to-r from-blue-50 to-purple-50 p-2 rounded-lg border-2 border-purple-200">
              <Clock className="w-5 h-5 text-purple-600" />
              <div className="flex gap-1">
                {['past', 'present', 'future'].map((layer) => (
                  <button
                    key={layer}
                    onClick={() => switchTimeLayer(layer)}
                    className={`px-3 py-1 rounded text-sm font-medium transition ${
                      timeLayer === layer
                        ? 'bg-purple-600 text-white shadow-md'
                        : 'bg-white text-gray-700 hover:bg-purple-100'
                    }`}
                  >
                    {timeLayerLabels[layer]}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-1 sm:gap-2 mb-3">
            <button
              onClick={saveConstellation}
              className="flex items-center justify-center gap-1 sm:gap-2 bg-green-600 text-white px-2 sm:px-3 lg:px-4 py-2 rounded-lg hover:bg-green-700 transition flex-1 sm:flex-initial text-sm sm:text-base"
              title="Guardar constelación en archivo JSON"
            >
              <Save className="w-4 h-4" />
              <span className="hidden sm:inline">Guardar</span>
            </button>
            <button
              onClick={exportSummary}
              className="flex items-center justify-center gap-1 sm:gap-2 bg-teal-600 text-white px-2 sm:px-3 lg:px-4 py-2 rounded-lg hover:bg-teal-700 transition flex-1 sm:flex-initial text-sm sm:text-base"
              title="Exportar resumen textual completo"
            >
              <FileText className="w-4 h-4" />
              <span className="hidden sm:inline">Resumen</span>
            </button>
            <label className="flex items-center justify-center gap-1 sm:gap-2 bg-blue-600 text-white px-2 sm:px-3 lg:px-4 py-2 rounded-lg hover:bg-blue-700 transition cursor-pointer flex-1 sm:flex-initial text-sm sm:text-base">
              <Upload className="w-4 h-4" />
              <span className="hidden sm:inline">Cargar</span>
              <input type="file" accept=".json" onChange={loadConstellation} className="hidden" />
            </label>
            <button
              onClick={clearCanvas}
              className="flex items-center justify-center gap-1 sm:gap-2 bg-red-600 text-white px-2 sm:px-3 lg:px-4 py-2 rounded-lg hover:bg-red-700 transition flex-1 sm:flex-initial text-sm sm:text-base"
              title="Limpiar constelación actual"
            >
              <Trash2 className="w-4 h-4" />
              <span className="hidden sm:inline">Limpiar</span>
            </button>
            <button
              onClick={exportPNG}
              className="flex items-center justify-center gap-1 sm:gap-2 bg-indigo-600 text-white px-2 sm:px-3 lg:px-4 py-2 rounded-lg hover:bg-indigo-700 transition flex-1 sm:flex-initial text-sm sm:text-base"
              title="Exportar imagen de capa actual"
            >
              <Image className="w-4 h-4" />
              <span className="hidden sm:inline">PNG</span>
            </button>
            <button
              onClick={applyFamilyTemplate}
              className="flex items-center justify-center gap-1 sm:gap-2 bg-amber-500 text-white px-2 sm:px-3 py-2 rounded-lg hover:bg-amber-600 transition flex-1 sm:flex-initial text-sm sm:text-base"
              title="Cargar plantilla de familia base"
            >
              <LayoutTemplate className="w-4 h-4" />
              <span className="hidden sm:inline">Plantilla</span>
            </button>
            <button
              onClick={() => setShowPatternsModal(true)}
              className="flex items-center justify-center gap-1 sm:gap-2 bg-amber-600 text-white px-2 sm:px-3 py-2 rounded-lg hover:bg-amber-700 transition flex-1 sm:flex-initial text-sm sm:text-base"
              title="Ver patrones comunes"
            >
              <Lightbulb className="w-4 h-4" />
              <span className="hidden sm:inline">Patrones</span>
            </button>
            <button
              onClick={handleUndo}
              disabled={!canUndo}
              aria-label="Deshacer"
              className={`flex items-center justify-center gap-1 sm:gap-2 px-2 sm:px-3 py-2 rounded-lg flex-1 sm:flex-initial text-sm sm:text-base ${
                canUndo
                  ? 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
            >
              <Undo2 className="w-4 h-4" />
            </button>
            <button
              onClick={handleRedo}
              disabled={!canRedo}
              aria-label="Rehacer"
              className={`flex items-center justify-center gap-1 sm:gap-2 px-2 sm:px-3 py-2 rounded-lg flex-1 sm:flex-initial text-sm sm:text-base ${
                canRedo
                  ? 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
            >
              <Redo2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleZoomButton(-0.1)}
              aria-label="Alejar"
              className="flex items-center justify-center gap-1 bg-white border border-gray-300 text-gray-800 px-2 sm:px-3 py-2 rounded-lg hover:bg-gray-50 transition text-sm sm:text-base"
              title="Alejar"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleZoomButton(0.1)}
              aria-label="Acercar"
              className="flex items-center justify-center gap-1 bg-white border border-gray-300 text-gray-800 px-2 sm:px-3 py-2 rounded-lg hover:bg-gray-50 transition text-sm sm:text-base"
              title="Acercar"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              onClick={() => setIsPanningMode((v) => !v)}
              aria-label="Modo panorama"
              className={`flex items-center justify-center gap-1 px-2 sm:px-3 py-2 rounded-lg text-sm sm:text-base ${
                isPanningMode
                  ? 'bg-sky-600 text-white hover:bg-sky-700'
                  : 'bg-white border border-gray-300 text-gray-800 hover:bg-gray-50'
              }`}
              title="Modo panorama"
            >
              <Move className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                if (confirm('¿Resetear el borrador guardado?')) {
                  localStorage.removeItem('constellationDraft');
                  window.location.reload();
                }
              }}
              aria-label="Resetear borrador autosave"
              className="flex items-center justify-center gap-1 sm:gap-2 bg-gray-600 text-white px-2 sm:px-3 py-2 rounded-lg hover:bg-gray-700 transition flex-1 sm:flex-initial text-sm sm:text-base"
              title="Resetear borrador autosave"
            >
              <RotateCw className="w-4 h-4" />
            </button>
            <button
              onClick={() => setPresentationMode((v) => !v)}
              aria-label={presentationMode ? 'Salir de modo presentación' : 'Entrar en modo presentación'}
              className={`flex items-center justify-center gap-1 px-2 sm:px-3 py-2 rounded-lg text-sm sm:text-base ${
                presentationMode
                  ? 'bg-purple-700 text-white hover:bg-purple-800'
                  : 'bg-purple-100 text-purple-800 hover:bg-purple-200'
              }`}
              title="Modo presentación"
            >
              {presentationMode ? (
                <Minimize2 className="w-4 h-4" />
              ) : (
                <Maximize2 className="w-4 h-4" />
              )}
            </button>
          </div>

          <p className="text-xs sm:text-sm text-gray-600 flex flex-wrap gap-2">
            <span>Clic izq: arrastrar</span>·
            <span>Clic der: menú</span>·
            <span>Doble clic: añadir</span>·
            <span>Rueda: rotar</span>·
            <span>Ctrl+rueda: zoom</span>
          </p>
        </div>

        <div
          className={
            presentationMode
              ? 'flex flex-col gap-3 sm:gap-4 lg:gap-6'
              : 'flex flex-col lg:grid lg:grid-cols-[300px_1fr_300px] xl:grid-cols-[350px_1fr_350px] gap-3 sm:gap-4 lg:gap-6'
          }
        >
          {/* Panel izquierdo */}
          {!presentationMode && (
            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
              <button
                onClick={() => setShowMembersPanel(!showMembersPanel)}
                className="lg:hidden w-full flex items-center justify-between p-4 bg-purple-600 text-white font-semibold"
              >
                <span>Miembros ({members.length})</span>
                {showMembersPanel ? (
                  <ChevronUp className="w-5 h-5" />
                ) : (
                  <ChevronDown className="w-5 h-5" />
                )}
              </button>

              <div
                className={`p-4 sm:p-6 space-y-4 ${
                  showMembersPanel ? 'block' : 'hidden lg:block'
                }`}
              >
                <h2 className="hidden lg:block text-xl font-bold text-gray-800 mb-4">
                  Miembros
                </h2>

                <button
                  onClick={() => setShowAddForm(!showAddForm)}
                  className="w-full flex items-center justify-center gap-2 bg-purple-600 text-white px-4 py-2 sm:py-3 rounded-lg hover:bg-purple-700 transition text-sm sm:text-base"
                >
                  <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                  Añadir miembro
                </button>

                {showAddForm && (
                  <div className="bg-purple-50 p-3 sm:p-4 rounded-lg space-y-2 sm:space-y-3">
                    <input
                      type="text"
                      placeholder="Nombre"
                      value={newMember.name}
                      onChange={(e) =>
                        setNewMember({ ...newMember, name: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-600 outline-none text-sm sm:text-base"
                    />
                    <select
                      value={newMember.generation}
                      onChange={(e) =>
                        setNewMember({
                          ...newMember,
                          generation: parseInt(e.target.value),
                        })
                      }
                      className="w-full px-3 py-2 border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-600 outline-none text-sm sm:text-base"
                    >
                      {generations.map((gen) => (
                        <option key={gen.value} value={gen.value}>
                          {gen.label}
                        </option>
                      ))}
                    </select>
                    <input
                      type="text"
                      placeholder="Rol (ej: Madre)"
                      value={newMember.role}
                      onChange={(e) =>
                        setNewMember({ ...newMember, role: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-600 outline-none text-sm sm:text-base"
                    />
                    <button
                      onClick={addMember}
                      className="w-full bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition text-sm sm:text-base"
                    >
                      Crear
                    </button>
                  </div>
                )}

                <div className="space-y-2 max-h-60 lg:max-h-96 overflow-y-auto">
                  {members.map((member) => (
                    <div
                      key={member.id}
                      onClick={() => {
                        setSelectedMember(member);
                        if (window.innerWidth < 1024) {
                          setShowDetailsPanel(true);
                          setShowMembersPanel(false);
                        }
                      }}
                      className={`p-2 sm:p-3 rounded-lg cursor-pointer transition ${
                        selectedMember?.id === member.id
                          ? 'bg-purple-100 border-2 border-purple-600'
                          : 'bg-gray-50 hover:bg-gray-100'
                      } ${connectingFrom === member.id ? 'ring-2 ring-blue-400' : ''}`}
                    >
                      <div className="flex items-center gap-2">
                        {member.emotion && (
                          <span className="text-xl">{member.emotion}</span>
                        )}
                        <div
                          className="w-3 h-3 sm:w-4 sm:h-4 rounded-full flex-shrink-0"
                          style={{ backgroundColor: member.color }}
                        />
                        <span className="font-semibold text-gray-800 text-sm sm:text-base truncate">
                          {member.name}
                        </span>
                      </div>
                      {member.role && (
                        <p className="text-xs sm:text-sm text-gray-600 ml-5 sm:ml-6 truncate">
                          {member.role}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Canvas */}
          <div className="bg-white rounded-lg shadow-lg p-3 sm:p-4 lg:p-6 order-first lg:order-none">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <h2 className="text-lg sm:text-xl font-bold text-gray-800">
                Constelación - {timeLayerLabels[timeLayer]}
              </h2>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Smile className="w-4 h-4" />
                <span>Emociones activas</span>
              </div>
            </div>
            <div ref={canvasContainerRef} className="w-full overflow-auto">
              <canvas
                ref={canvasRef}
                width={canvasSize.width}
                height={canvasSize.height}
                onMouseDown={handleCanvasMouseDown}
                onMouseMove={handleCanvasMouseMove}
                onDoubleClick={handleCanvasDoubleClick}
                onContextMenu={handleCanvasContextMenu}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                className={`border-2 rounded-lg bg-white touch-none w-full transition-all ${
                  connectingFrom
                    ? 'border-blue-500 cursor-crosshair'
                    : draggingMember
                    ? 'border-green-500 cursor-move'
                    : isPanningMode
                    ? 'border-sky-500 cursor-grab'
                    : 'border-gray-300 cursor-default'
                }`}
                style={{ maxWidth: '100%', height: 'auto' }}
              />
              {connectingFrom && (
                <p className="text-xs text-blue-600 text-center mt-2 font-semibold animate-pulse">
                  🔗 Haz clic en otro miembro para crear vínculo
                </p>
              )}
            </div>
          </div>

          {/* Panel derecho */}
          {!presentationMode && (
            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
              <button
                onClick={() => setShowDetailsPanel(!showDetailsPanel)}
                className="lg:hidden w-full flex items-center justify-between p-4 bg-blue-600 text-white font-semibold"
              >
                <span>Vínculos ({connections.length})</span>
                {showDetailsPanel ? (
                  <ChevronUp className="w-5 h-5" />
                ) : (
                  <ChevronDown className="w-5 h-5" />
                )}
              </button>

              <div
                className={`p-4 sm:p-6 space-y-4 ${
                  showDetailsPanel ? 'block' : 'hidden lg:block'
                }`}
              >
                <h2 className="hidden lg:block text-xl font-bold text-gray-800 mb-4">
                  Vínculos
                </h2>

                {/* Ficha del miembro seleccionado */}
                {selectedMember && (
                  <div className="mb-3 p-3 rounded-lg bg-blue-50 border border-blue-200 text-xs sm:text-sm">
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        {selectedMember.emotion && (
                          <span className="text-2xl">{selectedMember.emotion}</span>
                        )}
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: selectedMember.color }}
                        />
                        <span className="font-semibold text-gray-800 truncate">
                          {selectedMember.name}
                        </span>
                      </div>
                    </div>
                    {selectedMember.role && (
                      <p className="text-gray-700 mb-1">
                        Rol: <span className="font-medium">{selectedMember.role}</span>
                      </p>
                    )}
                    {selectedMember.emotion && (
                      <p className="text-gray-700 mb-1">
                        Emoción:{' '}
                        <span className="font-medium">
                          {EMOTIONS.find((e) => e.emoji === selectedMember.emotion)?.name || 'Personalizada'}
                        </span>
                      </p>
                    )}
                    <p className="text-gray-700">
                      Dirección:{' '}
                      <span className="font-medium">
                        {Math.round(selectedMember.rotation || 0)}°
                      </span>
                    </p>
                    {selectedMember.notes && (
                      <p className="text-gray-600 text-xs mt-2 italic border-t pt-2">
                        {selectedMember.notes}
                      </p>
                    )}
                  </div>
                )}

                <h3 className="font-semibold text-gray-800 text-sm sm:text-base pt-4 border-t">
                  Conexiones actuales
                </h3>
                <div className="space-y-2 max-h-60 lg:max-h-96 overflow-y-auto">
                  {sortedConnections.map((conn) => {
                    const from = members.find((m) => m.id === conn.from);
                    const to = members.find((m) => m.id === conn.to);
                    if (!from || !to) return null;

                    const isSelectedConn =
                      selectedMember && (from.id === selectedMember.id || to.id === selectedMember.id);

                    return (
                      <div
                        key={conn.id}
                        className={`bg-gray-50 p-2 sm:p-3 rounded-lg hover:bg-gray-100 transition ${
                          isSelectedConn ? 'border border-blue-300' : ''
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2 gap-2">
                          <span className="text-xs sm:text-sm font-medium text-gray-800 truncate flex-1">
                            {from.name} → {to.name}
                          </span>
                          <button
                            onClick={() => deleteConnection(conn.id)}
                            className="text-red-600 hover:text-red-800 flex-shrink-0"
                            aria-label="Eliminar conexión"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        </div>
                        <select
                          value={conn.type}
                          onChange={(e) => updateConnectionType(conn.id, e.target.value)}
                          className="w-full px-2 py-1 text-xs sm:text-sm border border-gray-300 rounded focus:ring-2 focus:ring-purple-600 outline-none bg-white"
                        >
                          {connectionTypes.map((ct) => (
                            <option key={ct.type} value={ct.type}>
                              {ct.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    );
                  })}
                  {connections.length === 0 && (
                    <p className="text-gray-500 text-xs sm:text-sm italic text-center py-4">
                      No hay conexiones aún
                    </p>
                  )}
                </div>

                <div className="pt-4 border-t border-gray-200">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notas de sesión - {timeLayerLabels[timeLayer]}
                  </label>
                  <textarea
                    value={sessionNotes}
                    onChange={(e) => setSessionNotes(e.target.value)}
                    placeholder="Observaciones generales sobre esta capa temporal..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 outline-none text-sm"
                    rows={4}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Leyenda */}
        <details className="bg-white rounded-lg shadow-lg p-4 sm:p-6 mt-3 sm:mt-4 lg:mt-6">
          <summary className="cursor-pointer font-bold text-base sm:text-xl text-gray-800 mb-4 list-none flex items-center justify-between">
            <span>Leyenda</span>
            <ChevronDown className="w-5 h-5" />
          </summary>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mt-4">
            <div>
              <h3 className="font-semibold text-gray-700 mb-2 text-sm sm:text-base">
                Generaciones
              </h3>
              <div className="space-y-2">
                {generations.map((gen) => (
                  <div key={gen.value} className="flex items-center gap-2">
                    <div
                      className="w-5 h-5 sm:w-6 sm:h-6 rounded-full flex-shrink-0"
                      style={{ backgroundColor: gen.color }}
                    />
                    <span className="text-xs sm:text-sm text-gray-700">
                      {gen.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-gray-700 mb-2 text-sm sm:text-base">
                Tipos de conexión
              </h3>
              <div className="space-y-2">
                {connectionTypes.map((ct) => (
                  <div key={ct.type} className="flex items-center gap-2">
                    <div
                      className="w-10 sm:w-12 flex-shrink-0"
                      style={{
                        backgroundColor: ct.color,
                        height: `${ct.width}px`,
                        borderStyle: ct.dash ? 'dashed' : 'solid',
                      }}
                    />
                    <span className="text-xs sm:text-sm text-gray-700">
                      {ct.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-gray-700 mb-2 text-sm sm:text-base">
                Emociones
              </h3>
              <div className="space-y-1 max-h-48 overflow-y-auto">
                {EMOTIONS.map((emotion) => (
                  <div key={emotion.name} className="flex items-center gap-2">
                    <span className="text-xl">{emotion.emoji}</span>
                    <span className="text-xs sm:text-sm text-gray-700">
                      {emotion.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </details>
      </div>

      {/* Modales */}
      {quickAddPosition && (
        <QuickAddModal
          position={{ x: quickAddPosition.screenX, y: quickAddPosition.screenY }}
          onAdd={(name, generation) => {
            quickAddMember(name, generation);
            setQuickAddPosition(null);
          }}
          onClose={() => setQuickAddPosition(null)}
          generations={generations}
        />
      )}

      {contextMenu?.type === 'member' && (
        <MemberContextMenu
          position={{ x: contextMenu.x, y: contextMenu.y }}
          member={contextMenu.member}
          onAction={handleContextMenuAction}
          onClose={() => setContextMenu(null)}
        />
      )}

      {editingMember && (
        <EditNameModal
          member={editingMember}
          onSave={handleEditMember}
          onClose={() => setEditingMember(null)}
        />
      )}

      {colorPickerMember && (
        <ColorPickerModal
          member={colorPickerMember}
          onSelectColor={(color) => {
            updateMemberColor(color);
            setColorPickerMember(null);
          }}
          onClose={() => setColorPickerMember(null)}
        />
      )}

      {emotionPickerMember && (
        <EmotionPickerModal
          member={emotionPickerMember}
          onSelectEmotion={(emotion) => {
            updateMemberEmotion(emotion);
            setEmotionPickerMember(null);
          }}
          onClose={() => setEmotionPickerMember(null)}
        />
      )}

      {rotationModalMember && (
        <RotationModal
          member={rotationModalMember}
          onRotate={(rotation) => {
            updateMemberRotation(rotation);
            setRotationModalMember(null);
          }}
          onClose={() => setRotationModalMember(null)}
        />
      )}

      {showPatternsModal && (
        <PatternsModal onClose={() => setShowPatternsModal(false)} />
      )}
    </div>
  );
};

export default ConstellationApp;
