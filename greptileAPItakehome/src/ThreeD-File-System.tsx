import React, { useEffect, useState } from "react";
import axios from "axios";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Text, Sparkles, Stars } from "@react-three/drei";
import './ThreeD-File-System.css'

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
  const [loading, setLoading] = useState(false);
  const [greptileMessage, setGreptileMessage] = useState<string | null>(null);
  const fetchRepoContents = async (path: string = ""): Promise<GitHubContent[]> => {
    try {
      const result = await axios.get<GitHubContent[]>(
        `https://api.github.com/repos/${owner}/${repo}/contents${path ? `/${path}` : ""}`,
        {
          headers: {
            Authorization: import.meta.env.VITE_GITHUB_TOKEN,
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

  const queryGreptile = async () => {
    setLoading(true);
    setGreptileMessage(null);
  
    const greptileApiKey = import.meta.env.VITE_GREPTILE_API_KEY;
    const githubToken = import.meta.env.VITE_GITHUB_TOKEN;
    
    const options = {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${greptileApiKey}`,
        'X-GitHub-Token': `${githubToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messages: [
          {
            content: `How does ${selectedUrl} connect to the overall GitHub repository? Tell me its role and what it connects to.`,
            role: "user"
          }
        ],
        repositories: [
          {
            remote: "github",
            branch: "main",
            repository: `${owner}/${repo}`
          }
        ]
      })
    };
  
    try {
      const response = await fetch('https://api.greptile.com/v2/query', options);
      const data = await response.json();
      setGreptileMessage(data.message); // Assuming the response has a 'message' field
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

const Modal = ({ url, onClose }: { url: string, onClose: () => void }) => (
  <div className={`modal ${loading ? "modal-fade" : ""}`}>
      <>
        <p>View contents on GitHub: <a href={url} target="_blank" rel="noopener noreferrer">{url}</a></p>
        {!greptileMessage && <h4>Ask Greptile how the selected file fits into the overall GitHub repository.</h4>}
        {!greptileMessage && <button onClick={queryGreptile}>🦎 Ask Greptile 🦎</button>}
        <button onClick={onClose}>Close</button>
        {loading && <div className="spinner"></div>}
        {loading && <h4>Greptile is chameleoning its way through your code...</h4>}
        {greptileMessage && <h4>Greptile Response:</h4>}
        {greptileMessage && <p className="greptile-message">{greptileMessage}</p>}
      </>
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

  // Render the Orb Nodes. Each node is a folder or a file.
  const renderNodes = (contents: GitHubContent[], level: number = 0, parentPos: [number, number, number] = [0, 0, 0]) => {
    return contents.map((item, index) => {
      const position: [number, number, number] = [
        parentPos[0] + (index % 5) * NODE_SPACING,
        parentPos[1] + Math.floor(index / 5) * NODE_SPACING,
        parentPos[2] - level * LEVEL_SPACING,
      ];

      return (
        <React.Fragment key={item.sha}>
          <mesh
            position={position}
            onClick={() => item.type === "dir" && handleNodeClick(item.sha)}
            onContextMenu={() => {
              setSelectedUrl(item.html_url);
              setIsModalOpen(true);
            }}
          >
            <Sparkles
              size={12}
              scale={.9}
              color={item.type === "dir" ? (openDirs.has(item.sha) ? "orange" : "blue") : "green"}
            />
            <meshStandardMaterial
              color={item.type === "dir" ? (openDirs.has(item.sha) ? "orange" : "blue") : "green"}
            />
            <Text
              position={[0, 1, 0]}
              fontSize={0.35}
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
  return (
    <>
      <div className="canvas">
        <Canvas>
          <ambientLight intensity={0.5} />
          <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} />
          <OrbitControls />
          <Stars />
          {renderNodes(repoData)}
          <Text
              position={[0, 350, 0]}
              fontSize={45}
              color="white"
              anchorX="center"
              anchorY="middle"
            >
              {owner}/{repo}
            </Text >
        </Canvas>
      </div>
      {isModalOpen && selectedUrl && (
        <Modal url={selectedUrl} onClose={() => {setIsModalOpen(false), setGreptileMessage(null)}} />
      )}
      {error && <p>Error: {error}</p>}
    </>
  );
};

export default GitHubRepoVisualizer;
