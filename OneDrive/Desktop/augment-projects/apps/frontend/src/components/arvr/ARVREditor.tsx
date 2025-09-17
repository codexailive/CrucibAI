import React, { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, TransformControls, Grid, Sky } from '@react-three/drei';

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
          <Canvas
            camera={{ position: [5, 5, 5], fov: 60 }}
            style={{ background: '#1a1a1a' }}
          >
            <ambientLight intensity={0.4} />
            <directionalLight position={[10, 10, 5]} intensity={1} />
            
            <Grid 
              args={[20, 20]} 
              cellSize={1} 
              cellThickness={0.5} 
              cellColor="#444444" 
              sectionSize={5} 
              sectionThickness={1} 
              sectionColor="#666666" 
            />
            
            <Sky sunPosition={[100, 20, 100]} />
            
            {objects.map(obj => (
              <SceneObjectComponent
                key={obj.id}
                object={obj}
                isSelected={selectedObject === obj.id}
                transformMode={transformMode}
                onUpdate={(updates) => updateObject(obj.id, updates)}
                onClick={() => setSelectedObject(obj.id)}
              />
            ))}
            
            <OrbitControls enablePan={true} enableZoom={true} enableRotate={true} />
          </Canvas>

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
interface SceneObjectComponentProps {
  object: SceneObject;
  isSelected: boolean;
  transformMode: 'translate' | 'rotate' | 'scale';
  onUpdate: (updates: Partial<SceneObject>) => void;
  onClick: () => void;
}

const SceneObjectComponent: React.FC<SceneObjectComponentProps> = ({
  object,
  isSelected,
  transformMode,
  onUpdate,
  onClick
}) => {
  const meshRef = useRef<THREE.Mesh>(null);

  const handleTransform = () => {
    if (meshRef.current) {
      const { position, rotation, scale } = meshRef.current;
      onUpdate({
        position: [position.x, position.y, position.z],
        rotation: [rotation.x, rotation.y, rotation.z],
        scale: [scale.x, scale.y, scale.z]
      });
    }
  };

  const renderGeometry = () => {
    switch (object.type) {
      case 'primitive':
        if (object.name.toLowerCase().includes('sphere')) {
          return <sphereGeometry args={[1, 32, 32]} />;
        }
        return <boxGeometry args={[1, 1, 1]} />;
      default:
        return <boxGeometry args={[1, 1, 1]} />;
    }
  };

  return (
    <group>
      <mesh
        ref={meshRef}
        position={object.position}
        rotation={object.rotation}
        scale={object.scale}
        onClick={onClick}
      >
        {renderGeometry()}
        <meshStandardMaterial 
          color={object.properties.color} 
          transparent={isSelected}
          opacity={isSelected ? 0.8 : 1}
        />
      </mesh>
      
      {isSelected && (
        <TransformControls
          object={meshRef.current!}
          mode={transformMode}
          onObjectChange={handleTransform}
        />
      )}
    </group>
  );
};

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
              <Canvas camera={{ position: [0, 1.7, 3], fov: 90 }}>
                <ambientLight intensity={0.6} />
                <directionalLight position={[5, 5, 5]} intensity={0.8} />
                
                {objects.map(obj => (
                  <mesh
                    key={obj.id}
                    position={obj.position}
                    rotation={obj.rotation}
                    scale={obj.scale}
                  >
                    {obj.name.toLowerCase().includes('sphere') ? (
                      <sphereGeometry args={[1, 32, 32]} />
                    ) : (
                      <boxGeometry args={[1, 1, 1]} />
                    )}
                    <meshStandardMaterial color={obj.properties.color} />
                  </mesh>
                ))}
                
                <OrbitControls enablePan={false} enableZoom={false} />
              </Canvas>
              
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
