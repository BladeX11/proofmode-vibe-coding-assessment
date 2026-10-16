import { Canvas, useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";

function HoloGeometry() {
  const rig = useRef<THREE.Group>(null);
  const orb = useRef<THREE.Mesh>(null);
  useFrame(({ pointer, clock }) => {
    if (rig.current) {
      rig.current.rotation.y += (pointer.x * 0.12 - rig.current.rotation.y) * 0.035;
      rig.current.rotation.x += (-pointer.y * 0.08 - rig.current.rotation.x) * 0.035;
      rig.current.position.y = Math.sin(clock.elapsedTime * 0.5) * 0.045;
    }
    if (orb.current) orb.current.rotation.y += 0.004;
  });
  return <group ref={rig}>
    <mesh position={[0, 0, -0.22]} rotation={[0.02, -0.07, -0.02]}>
      <boxGeometry args={[3.65, 2.62, 0.12]} />
      <meshStandardMaterial color="#111622" emissive="#00ff88" emissiveIntensity={0.12} metalness={0.58} roughness={0.35} transparent opacity={0.96} />
    </mesh>
    <mesh position={[0, 0, -0.145]}>
      <boxGeometry args={[3.5, 2.48, 0.025]} />
      <meshBasicMaterial color="#111821" transparent opacity={0.92} />
    </mesh>
    <mesh position={[1.47, 0.95, -0.12]}>
      <sphereGeometry args={[0.035, 12, 12]} />
      <meshBasicMaterial color="#00ff88" />
    </mesh>
    <group position={[1.65, 1.12, 0.14]}>
      <mesh ref={orb}><sphereGeometry args={[0.34, 32, 32]} /><meshStandardMaterial color="#41ffff" emissive="#00d4ff" emissiveIntensity={2.4} metalness={0.25} roughness={0.2} /></mesh>
      <mesh><torusGeometry args={[0.48, 0.008, 8, 64]} /><meshBasicMaterial color="#00d4ff" transparent opacity={0.62} /></mesh>
      <mesh rotation={[0.85, 0.1, 0.2]}><torusGeometry args={[0.57, 0.006, 8, 64]} /><meshBasicMaterial color="#ff00ff" transparent opacity={0.4} /></mesh>
    </group>
    <group position={[-1.25, -0.42, 0.12]} rotation={[0.02, 0.06, -0.03]}>
      <mesh><boxGeometry args={[1.05, 0.58, 0.07]} /><meshBasicMaterial color="#142328" transparent opacity={0.93} /></mesh>
      {[-0.16, -0.035, 0.09].map((y, i) => <mesh key={i} position={[-0.12, y, 0.042]}><boxGeometry args={[0.63 - i * 0.1, 0.018, 0.006]} /><meshBasicMaterial color={i === 1 ? "#00d4ff" : "#00ff88"} transparent opacity={0.78} /></mesh>)}
    </group>
    <group position={[1.42, -0.84, 0.08]}>
      <mesh><boxGeometry args={[0.85, 0.42, 0.06]} /><meshBasicMaterial color="#211628" transparent opacity={0.92} /></mesh>
      <mesh position={[-0.2, 0.07, 0.04]}><circleGeometry args={[0.055, 16]} /><meshBasicMaterial color="#00ff88" /></mesh>
      <mesh position={[0.14, -0.075, 0.04]}><boxGeometry args={[0.38, 0.025, 0.005]} /><meshBasicMaterial color="#ff00ff" transparent opacity={0.8} /></mesh>
    </group>
    <mesh position={[0, -1.5, -0.3]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[8, 8, 22, 22]} />
      <meshBasicMaterial color="#15302a" wireframe transparent opacity={0.17} />
    </mesh>
  </group>;
}

export default function HeroScene() {
  return <div className="hero-art r3f-art" aria-label="Interactive holographic coding workspace">
    <div className="hero-art-grid" aria-hidden="true" />
    <Canvas camera={{ position: [0, 0, 6.4], fov: 39 }} dpr={[1, 1.4]} gl={{ alpha: true, antialias: true, powerPreference: "low-power" }} fallback={<div className="hero-scene-fallback">3D preview unavailable · static view shown</div>}>
      <ambientLight intensity={0.72} /><pointLight position={[4, 4, 4]} color="#00d4ff" intensity={17} /><pointLight position={[-3, 1, 2]} color="#00ff88" intensity={9} /><pointLight position={[0, -3, 1]} color="#ff00ff" intensity={5} /><HoloGeometry />
    </Canvas>
    <div className="hero-code-card hero-code-overlay" aria-hidden="true"><div className="hero-code-head"><span className="window-dots"><i /><i /><i /></span><span>formatDuration.ts</span><span className="hero-live"><i />LIVE</span></div><div className="hero-code-body"><div className="code-gutter">01<br/>02<br/>03<br/>04<br/>05<br/>06<br/>07<br/>08</div><div className="code-lines"><b>export function</b> <em>formatDuration</em>(sec) {'{'}<br/><span>const safe = Math.max(0, Math.floor(sec));</span><br/><span>if (safe &lt; 60) return <i>`${'{'}safe{'}'} sec`</i>;</span><br/><span>const min = Math.floor(safe / 60);</span><br/><span>const rem = safe % 60;</span><br/><span>return rem ? <i>`${'{'}min{'}'} min ${'{'}rem{'}'} sec`</i></span><br/><span className="indent">: <i>`${'{'}min{'}'} min`</i>;</span><br/>{'}'}</div></div><div className="hero-test-row"><span>✓ 4 / 4 checks passed</span><span className="hero-commit">+ 8 lines</span></div></div>
    <div className="float-card float-evidence"><span className="float-icon"><span>◉</span></span><div><b>Evidence linked</b><small>EV-03 · Boundary test</small></div><span className="float-check">✓</span></div>
    <div className="float-card float-prompt"><span className="float-icon cyan"><span>⌕</span></span><div><b>59s boundary</b><small>Candidate caught the flaw</small></div></div>
    <div className="hero-footprint"><span>SESSION / 04:32</span><span>● CAPTURE ACTIVE</span></div><div className="hero-scan" />
  </div>;
}
