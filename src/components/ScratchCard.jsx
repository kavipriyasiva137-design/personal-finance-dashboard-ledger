import React, { useRef, useEffect, useState } from 'react';
import { Sparkles, Trophy } from 'lucide-react';

export default function ScratchCard({ id, rewardAmount, message, isScratched, onClaim }) {
  const canvasRef = useRef(null);
  const [scratchedPercent, setScratchedPercent] = useState(0);
  const [claimed, setClaimed] = useState(isScratched);
  const isDrawingRef = useRef(false);

  useEffect(() => {
    if (claimed) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;

    // Draw scratch layer
    // GPay scratch cards have a silver-ish gradient
    const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    grad.addColorStop(0, '#bcc6d2');
    grad.addColorStop(0.5, '#e2e8f0');
    grad.addColorStop(1, '#a0aec0');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw Google Pay logo icon on the silver cover
    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.15)';
    ctx.shadowBlur = 4;
    ctx.fillStyle = '#4f46e5';
    ctx.beginPath();
    ctx.arc(canvas.width / 2, canvas.height / 2, 28, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 16px Outfit, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('GP', canvas.width / 2, canvas.height / 2);

    ctx.fillStyle = '#4a5568';
    ctx.font = '500 11px Outfit, sans-serif';
    ctx.fillText('SCRATCH TO REVEAL', canvas.width / 2, canvas.height / 2 + 45);

    // Helper functions for scratching
    const scratch = (clientX, clientY) => {
      const bbox = canvas.getBoundingClientRect();
      const x = clientX - bbox.left;
      const y = clientY - bbox.top;

      ctx.globalCompositeOperation = 'destination-out';
      ctx.beginPath();
      ctx.arc(x, y, 20, 0, Math.PI * 2);
      ctx.fill();

      checkScratchPercentage();
    };

    const checkScratchPercentage = () => {
      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const pixels = imgData.data;
      let transparentPixels = 0;

      for (let i = 3; i < pixels.length; i += 4) {
        if (pixels[i] === 0) {
          transparentPixels++;
        }
      }

      const totalPixels = pixels.length / 4;
      const percentage = (transparentPixels / totalPixels) * 100;
      setScratchedPercent(percentage);

      // If scratched > 45%, auto reveal and claim
      if (percentage > 45) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        setClaimed(true);
        onClaim(id);
      }
    };

    const handleMouseDown = (e) => {
      isDrawingRef.current = true;
      scratch(e.clientX, e.clientY);
    };

    const handleMouseMove = (e) => {
      if (!isDrawingRef.current) return;
      scratch(e.clientX, e.clientY);
    };

    const handleMouseUp = () => {
      isDrawingRef.current = false;
    };

    // Touch events
    const handleTouchStart = (e) => {
      isDrawingRef.current = true;
      if (e.touches[0]) {
        scratch(e.touches[0].clientX, e.touches[0].clientY);
      }
    };

    const handleTouchMove = (e) => {
      if (!isDrawingRef.current) return;
      if (e.touches[0]) {
        scratch(e.touches[0].clientX, e.touches[0].clientY);
      }
    };

    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    canvas.addEventListener('touchstart', handleTouchStart);
    canvas.addEventListener('touchmove', handleTouchMove);
    window.addEventListener('touchend', handleMouseUp);

    return () => {
      canvas.removeEventListener('mousedown', handleMouseDown);
      canvas.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      canvas.removeEventListener('touchstart', handleTouchStart);
      canvas.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleMouseUp);
    };
  }, [id, claimed, onClaim]);

  const isWin = rewardAmount > 0;

  return (
    <div className={`gpay-scratch-card ${claimed ? 'scratched' : ''}`}>
      {/* Reward Content revealed underneath */}
      <div className="scratch-card-reveal-content">
        {isWin ? (
          <div className="scratch-card-win">
            <Trophy className="reward-trophy" size={48} />
            <h4 className="reward-congrats">Congratulation!</h4>
            <p className="reward-sub">You earned cashback</p>
            <div className="reward-amount">₹{parseFloat(rewardAmount).toFixed(2)}</div>
            <Sparkles className="reward-sparkles" size={24} />
          </div>
        ) : (
          <div className="scratch-card-loss">
            <h4 className="reward-better-luck">Better luck next time!</h4>
            <p className="reward-sub">{message || 'Keep paying to win rewards.'}</p>
          </div>
        )}
      </div>

      {/* Silver cover layer */}
      {!claimed && (
        <canvas
          ref={canvasRef}
          className="scratch-card-canvas"
        />
      )}
    </div>
  );
}
