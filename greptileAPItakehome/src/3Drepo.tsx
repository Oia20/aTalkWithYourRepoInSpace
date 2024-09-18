import React, { useEffect, useState } from "react";
import axios from "axios";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import { Text } from '@react-three/drei';
import {Sparkles, Stars} from '@react-three/drei'

interface GitHubRepoVisualizerProps {
  owner: string;
  repo: string;
}

interface GitHubContent {
  name: string;
  path: string;
  sha: string;
  size: number;
  url: string;
  html_url: string;
  git_url: string;
  download_url: string | null;
  type: "file" | "dir";
  children?: GitHubContent[];
}

const NODE_SPACING = 5;
const LEVEL_SPACING = 4;

const GitHubRepoVisualizer: React.FC<GitHubRepoVisualizerProps> = ({
  owner,
  repo,
}) => {
  const [repoData, setRepoData] = useState<GitHubContent[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [openDirs, setOpenDirs] = useState<Set<string>>(new Set());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUrl, setSelectedUrl] = useState<string | null>(null);


  const fetchRepoContents = async (path: string = ""): Promise<GitHubContent[]> => {
    try {
      const result = await axios.get<GitHubContent[]>(
        `https://api.github.com/repos/${owner}/${repo}/contents${path ? `/${path}` : ""}`,
        {
          headers: {
            Authorization: `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`, // Replace with your GitHub token
          },
        }
      );
      return result.data;
    } catch (error: any) {
      setError(error.message || "Unknown error occurred");
      return [];
    }
  };


  const fetchAllContents = async (path: string = "") => {
    const contents = await fetchRepoContents(path);
  
    const allContents: GitHubContent[] = [];
    for (const content of contents) {
      if (content.type === "dir") {
        // Fetch contents of subdirectories
        const subContents: GitHubContent[] = await fetchAllContents(content.path);
        allContents.push({ ...content, children: subContents });
      } else {
        allContents.push(content);
      }
    }
  
    return allContents;
  };

  const Modal = ({ url, onClose }: { url: string, onClose: () => void }) => (
    <div
      style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        backgroundColor: 'white',
        padding: '20px',
        zIndex: 1000,
        boxShadow: '0px 0px 10px rgba(0, 0, 0, 0.5)',
        borderRadius: '8px',
      }}
    >
      <h2>GitHub File URL</h2>
      <p><a href={url} target="_blank" rel="noopener noreferrer">{url}</a></p>
      <button onClick={onClose}>Close</button>
    </div>
  );
  

  useEffect(() => {
    const fetchRepoData = async () => {
      const contents = await fetchAllContents();
      setRepoData(contents);
    };

    fetchRepoData();
  }, [owner, repo]);

  const handleNodeClick = (sha: string) => {
    setOpenDirs(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sha)) {
        newSet.delete(sha);
      } else {
        newSet.add(sha);
      }
      return newSet;
    });
  };

  const renderNodes = (contents: GitHubContent[], level: number = 0, parentPos: [number, number, number] = [0, 0, 0]) => {
    return contents.map((item, index) => {
      const position: [number, number, number] = [
        parentPos[0] + (index % 5) * NODE_SPACING,
        parentPos[1] + Math.floor(index / 5) * NODE_SPACING,
        parentPos[2] - level * LEVEL_SPACING,
      ];

      return (
        <React.Fragment key={item.sha}>
          <mesh position={position} onClick={() => item.type === "dir" && handleNodeClick(item.sha)} onContextMenu={() => {
    setSelectedUrl(item.html_url);
    setIsModalOpen(true);
  }}>
            <Sparkles size={12} scale={.9} color={item.type === "dir" ? (openDirs.has(item.sha) ? "orange" : "blue") : "green"} />
            <meshStandardMaterial color={item.type === "dir" ? (openDirs.has(item.sha) ? "orange" : "blue") : "green"} />
            <Text
              position={[0, 1, 0]}
              fontSize={0.3}
              color="white"
              anchorX="center"
              anchorY="middle"
              onClick={() => item.type === "dir" && handleNodeClick(item.sha)}
            >
              {item.name}
            </Text >
          </mesh>
          {item.type === "dir" && openDirs.has(item.sha) && renderNodes(item.children || [], level + 1, position)}
        </React.Fragment>
      );
    });
  };

  const renderConnections = (contents: GitHubContent[], parentPos: [number, number, number] = [0, 0, 0]) => {
    const connections: JSX.Element[] = [];
    
    contents.forEach((item, index) => {
      if (item.type === "dir" && item.children) {
        const itemPos: [number, number, number] = [
          parentPos[0] + (index % 5) * NODE_SPACING,
          parentPos[1] + Math.floor(index / 5) * NODE_SPACING,
          parentPos[2],
        ];

        item.children.forEach((subItem, subIndex) => {
          const childPos = [
            itemPos[0] + (subIndex % 5) * NODE_SPACING,
            itemPos[1] + Math.floor(subIndex / 5) * NODE_SPACING,
            itemPos[2] - LEVEL_SPACING
          ];
          
          const points = [new THREE.Vector3(...itemPos), new THREE.Vector3(...childPos)];
          
          connections.push(
            <line key={`${item.sha}-${subItem.sha}`}>
              <bufferGeometry attach="geometry">
                <bufferAttribute attach="position" count={points.length} array={new Float32Array(points.flatMap(v => [v.x, v.y, v.z]))} itemSize={3} />
              </bufferGeometry>
              <lineBasicMaterial attach="material" color="white" />
            </line>
          );
        });

        connections.push(...renderConnections(item.children, parentPos as [number, number, number]));
      }
    });
    
    return connections;
  };

  return (
    <>
      {error && <div>Error: {error}</div>}
      <Canvas style={{ background: "linear-gradient(70deg, #000, #000, #000)", position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} camera={{ fov: 90, position: [0, 12, 11] }}>
        <ambientLight />
        <pointLight position={[10, 10, 10]} />
        <OrbitControls />
        {renderConnections(repoData)}
        {renderNodes(repoData)}
        <Stars count={1000} />
      </Canvas>
      {isModalOpen && selectedUrl && (
      <Modal url={selectedUrl} onClose={() => setIsModalOpen(false)} />
    )}
    </>
  );
};

export default GitHubRepoVisualizer;
