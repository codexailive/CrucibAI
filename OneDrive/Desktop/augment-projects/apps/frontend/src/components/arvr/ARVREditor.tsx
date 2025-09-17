import React, { useEffect, useState } from 'react';
// Three.js imports temporarily disabled due to compatibility issues
// import * as THREE from 'three';
// import { Canvas } from '@react-three/fiber';
// import { OrbitControls, TransformControls, Grid, Sky } from '@react-three/drei';

interface ARVREditorProps {
  projectId: string;
  onSceneUpdate: (scene: any) => void;
}

interface SceneObject {
  id: string;
  name: string;
  type: '3d_model' | 'primitive' | 'text' | 'ui_element';
  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];
  properties: any;
}

const ARVREditor: React.FC<ARVREditorProps> = ({ projectId, onSceneUpdate }) => {
  const [objects, setObjects] = useState<SceneObject[]>([]);
  const [selectedObject, setSelectedObject] = useState<string | null>(null);
  const [transformMode, setTransformMode] = useState<'translate' | 'rotate' | 'scale'>('translate');
  const [viewMode, setViewMode] = useState<'3d' | 'ar' | 'vr'>('3d');
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    // Load project scene
    loadProjectScene();
  }, [projectId]);

  const loadProjectScene = async () => {
    try {
      // In a real app, fetch from API
      const mockObjects: SceneObject[] = [
        {
          id: '1',
          name: 'Cube',
          type: 'primitive',
          position: [0, 1, 0],
          rotation: [0, 0, 0],
          scale: [1, 1, 1],
          properties: { color: '#ff6b6b', material: 'standard' }
        },
        {
          id: '2',
          name: 'Sphere',
          type: 'primitive',
          position: [2, 1, 0],
          rotation: [0, 0, 0],
          scale: [1, 1, 1],
          properties: { color: '#4ecdc4', material: 'standard' }
        }
      ];
      setObjects(mockObjects);
    } catch (error) {
      console.error('Failed to load scene:', error);
    }
  };

  const addObject = (type: string) => {
    const newObject: SceneObject = {
      id: Date.now().toString(),
      name: `${type}_${objects.length + 1}`,
      type: type as any,
      position: [0, 1, 0],
      rotation: [0, 0, 0],
      scale: [1, 1, 1],
      properties: { color: '#ffffff', material: 'standard' }
    };

    setObjects([...objects, newObject]);
    setSelectedObject(newObject.id);
    onSceneUpdate({ objects: [...objects, newObject] });
  };

  const updateObject = (id: string, updates: Partial<SceneObject>) => {
    setObjects(objects.map(obj => 
      obj.id === id ? { ...obj, ...updates } : obj
    ));
    onSceneUpdate({ objects: objects.map(obj => 
      obj.id === id ? { ...obj, ...updates } : obj
    )});
  };

  const deleteObject = (id: string) => {
    setObjects(objects.filter(obj => obj.id !== id));
    if (selectedObject === id) {
      setSelectedObject(null);
    }
    onSceneUpdate({ objects: objects.filter(obj => obj.id !== id) });
  };

  return (
    <div className="arvr-editor">
      {/* Toolbar */}
      <div className="editor-toolbar">
        <div className="toolbar-section">
          <button 
            className={`tool-button ${viewMode === '3d' ? 'active' : ''}`}
            onClick={() => setViewMode('3d')}
          >
            3D View
          </button>
          <button 
            className={`tool-button ${viewMode === 'ar' ? 'active' : ''}`}
            onClick={() => setViewMode('ar')}
          >
            AR Preview
          </button>
          <button 
            className={`tool-button ${viewMode === 'vr' ? 'active' : ''}`}
            onClick={() => setViewMode('vr')}
          >
            VR Preview
          </button>
        </div>

        <div className="toolbar-section">
          <button 
            className={`tool-button ${transformMode === 'translate' ? 'active' : ''}`}
            onClick={() => setTransformMode('translate')}
          >
            Move
          </button>
          <button 
            className={`tool-button ${transformMode === 'rotate' ? 'active' : ''}`}
            onClick={() => setTransformMode('rotate')}
          >
            Rotate
          </button>
          <button 
            className={`tool-button ${transformMode === 'scale' ? 'active' : ''}`}
            onClick={() => setTransformMode('scale')}
          >
            Scale
          </button>
        </div>

        <div className="toolbar-section">
          <button 
            className={`play-button ${isPlaying ? 'playing' : ''}`}
            onClick={() => setIsPlaying(!isPlaying)}
          >
            {isPlaying ? 'Stop' : 'Play'}
          </button>
        </div>
      </div>

      <div className="editor-content">
        {/* Scene Hierarchy */}
        <div className="scene-hierarchy">
          <div className="hierarchy-header">
            <h3>Scene Hierarchy</h3>
            <div className="add-object-buttons">
              <button onClick={() => addObject('primitive')}>+ Cube</button>
              <button onClick={() => addObject('primitive')}>+ Sphere</button>
              <button onClick={() => addObject('text')}>+ Text</button>
            </div>
          </div>
          
          <div className="hierarchy-list">
            {objects.map(obj => (
              <div 
                key={obj.id}
                className={`hierarchy-item ${selectedObject === obj.id ? 'selected' : ''}`}
                onClick={() => setSelectedObject(obj.id)}
              >
                <span className="object-icon">📦</span>
                <span className="object-name">{obj.name}</span>
                <button 
                  className="delete-button"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteObject(obj.id);
                  }}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* 3D Viewport */}
        <div className="viewport-container">
          <div
            className="w-full h-full bg-gray-900 flex items-center justify-center rounded-lg"
            style={{ background: '#1a1a1a' }}
          >
            <div className="text-center text-white">
              <div className="text-6xl mb-4">🥽</div>
              <div className="text-xl font-bold mb-2">AR/VR Editor</div>
              <div className="text-gray-400 mb-4">3D Scene Viewport</div>
              <div className="text-sm text-gray-500">
                Objects: {objects.length} | Selected: {selectedObject || 'None'}
              </div>
              <div className="mt-4 text-xs text-gray-600">
                Three.js integration temporarily disabled
              </div>
            </div>
          </div>

          {/* Viewport Overlay */}
          <div className="viewport-overlay">
            <div className="viewport-info">
              <span>Objects: {objects.length}</span>
              <span>Selected: {selectedObject ? objects.find(o => o.id === selectedObject)?.name : 'None'}</span>
            </div>
          </div>
        </div>

        {/* Properties Panel */}
        <div className="properties-panel">
          <h3>Properties</h3>
          {selectedObject ? (
            <ObjectProperties
              object={objects.find(o => o.id === selectedObject)!}
              onUpdate={(updates) => updateObject(selectedObject, updates)}
            />
          ) : (
            <div className="no-selection">
              <p>Select an object to edit its properties</p>
            </div>
          )}
        </div>
      </div>

      {/* AR/VR Preview Modal */}
      {(viewMode === 'ar' || viewMode === 'vr') && (
        <ARVRPreviewModal
          mode={viewMode}
          objects={objects}
          onClose={() => setViewMode('3d')}
        />
      )}
    </div>
  );
};

// Scene Object Component
// SceneObjectComponent and related interfaces temporarily removed due to Three.js compatibility issues

// Object Properties Panel
interface ObjectPropertiesProps {
  object: SceneObject;
  onUpdate: (updates: Partial<SceneObject>) => void;
}

const ObjectProperties: React.FC<ObjectPropertiesProps> = ({ object, onUpdate }) => {
  return (
    <div className="object-properties">
      <div className="property-group">
        <label>Name</label>
        <input
          type="text"
          value={object.name}
          onChange={(e) => onUpdate({ name: e.target.value })}
        />
      </div>

      <div className="property-group">
        <label>Position</label>
        <div className="vector-input">
          <input
            type="number"
            step="0.1"
            value={object.position[0]}
            onChange={(e) => onUpdate({ 
              position: [parseFloat(e.target.value), object.position[1], object.position[2]]
            })}
          />
          <input
            type="number"
            step="0.1"
            value={object.position[1]}
            onChange={(e) => onUpdate({ 
              position: [object.position[0], parseFloat(e.target.value), object.position[2]]
            })}
          />
          <input
            type="number"
            step="0.1"
            value={object.position[2]}
            onChange={(e) => onUpdate({ 
              position: [object.position[0], object.position[1], parseFloat(e.target.value)]
            })}
          />
        </div>
      </div>

      <div className="property-group">
        <label>Scale</label>
        <div className="vector-input">
          <input
            type="number"
            step="0.1"
            min="0.1"
            value={object.scale[0]}
            onChange={(e) => onUpdate({ 
              scale: [parseFloat(e.target.value), object.scale[1], object.scale[2]]
            })}
          />
          <input
            type="number"
            step="0.1"
            min="0.1"
            value={object.scale[1]}
            onChange={(e) => onUpdate({ 
              scale: [object.scale[0], parseFloat(e.target.value), object.scale[2]]
            })}
          />
          <input
            type="number"
            step="0.1"
            min="0.1"
            value={object.scale[2]}
            onChange={(e) => onUpdate({ 
              scale: [object.scale[0], object.scale[1], parseFloat(e.target.value)]
            })}
          />
        </div>
      </div>

      <div className="property-group">
        <label>Color</label>
        <input
          type="color"
          value={object.properties.color}
          onChange={(e) => onUpdate({ 
            properties: { ...object.properties, color: e.target.value }
          })}
        />
      </div>

      <div className="property-group">
        <label>Material</label>
        <select
          value={object.properties.material}
          onChange={(e) => onUpdate({ 
            properties: { ...object.properties, material: e.target.value }
          })}
        >
          <option value="standard">Standard</option>
          <option value="basic">Basic</option>
          <option value="phong">Phong</option>
          <option value="lambert">Lambert</option>
        </select>
      </div>
    </div>
  );
};

// AR/VR Preview Modal
interface ARVRPreviewModalProps {
  mode: 'ar' | 'vr';
  objects: SceneObject[];
  onClose: () => void;
}

const ARVRPreviewModal: React.FC<ARVRPreviewModalProps> = ({ mode, objects, onClose }) => {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => setIsLoading(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="arvr-preview-modal">
      <div className="modal-content">
        <div className="modal-header">
          <h3>{mode.toUpperCase()} Preview</h3>
          <button className="close-button" onClick={onClose}>×</button>
        </div>
        
        <div className="modal-body">
          {isLoading ? (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Initializing {mode.toUpperCase()} preview...</p>
            </div>
          ) : (
            <div className="preview-container">
              <div className="w-full h-full bg-gray-800 flex items-center justify-center rounded-lg">
                <div className="text-center text-white">
                  <div className="text-4xl mb-3">👁️</div>
                  <div className="text-lg font-bold mb-2">{mode.toUpperCase()} Preview</div>
                  <div className="text-gray-400 mb-3">
                    {objects.length} objects in scene
                  </div>
                  <div className="text-xs text-gray-500">
                    3D preview temporarily disabled
                  </div>
                </div>
              </div>
              
              <div className="preview-controls">
                <button className="control-button">Reset View</button>
                <button className="control-button">Take Screenshot</button>
                <button className="control-button">Share Preview</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ARVREditor;
