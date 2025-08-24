# 🚀 Token Speed Visualizer

A beautiful, interactive web application that visualizes token generation speed in real-time, helping developers understand and optimize LLM streaming performance.

[![Visit token.qusai.pro](https://img.shields.io/badge/🚀_Visit-token.qusai.pro-blue?style=for-the-badge)](https://token.qusai.pro)

![Token Speed Visualizer](https://img.shields.io/badge/Status-Live-brightgreen)
![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=flat&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=flat&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=flat&logo=javascript&logoColor=black)

## ✨ Features

### 🎨 Modern UI/UX
- **Sleek Design**: Modern glassmorphism design with smooth gradients and subtle animations
- **Responsive Layout**: Fully responsive design that works on desktop, tablet, and mobile
- **Dark/Light Mode**: Automatic theme switching based on system preferences
- **Interactive Elements**: Hover effects, micro-interactions, and visual feedback

### 📊 Real-time Visualization
- **Particle Animation**: Beautiful particle system showing token flow across the canvas
- **Live Statistics**: Real-time display of tokens per second, elapsed time, words, and tokens generated
- **Dynamic Canvas**: Animated background grid with speed-based visual indicators
- **Smooth Streaming**: Simulates realistic text streaming with proper word boundaries

### 🎛️ Advanced Controls
- **Precise Speed Control**: Number input and slider for setting exact token speeds (0-200 TPS)
- **URL Parameters**: Set default speed via URL (`?speed=10` or `?speed=3.4`)
- **Keyboard Shortcuts**: Space to pause/resume, 'R' to reset
- **Smart Sync**: Input and slider stay synchronized automatically

### 🔧 Developer Tools
- **Copy Output**: One-click copy of generated text with visual feedback
- **Clear Function**: Quick reset of output text
- **Performance Optimized**: Efficient particle system with capped rendering
- **Accessibility**: Full ARIA support and keyboard navigation

## 🚀 Quick Start

### 🎯 Live Version (Recommended)
Visit **[token.qusai.pro](https://token.qusai.pro)** for the full experience with all features enabled.

### 💻 Local Development (Optional)
```bash
# Clone or download the repository
cd token-speed

# Start a local server
python3 -m http.server 8000

# Open in browser
open http://localhost:8000
```

Or simply open `index.html` directly in your browser for basic functionality.

## 📱 Usage

### Basic Controls
1. **Speed Input**: Enter exact tokens per second (0-200)
2. **Speed Slider**: Drag to adjust speed visually
3. **Pause/Resume**: Click button or press Space
4. **Reset**: Clear all data and restart

### URL Parameters
Set default speed by adding to URL:
```
https://token.qusai.pro?speed=15
https://token.qusai.pro?speed=3.4
```

### Keyboard Shortcuts
- `Space` - Pause/Resume animation
- `R` - Reset all data
- `Tab` - Navigate through controls

## 🎯 Use Cases

### For Developers
- **Timeout Optimization**: Understand how different speeds affect user experience
- **UX Planning**: Design appropriate loading states and progress indicators
- **Performance Testing**: Simulate various API response speeds
- **Client Demos**: Show streaming capabilities to stakeholders

### For Product Managers
- **Feature Planning**: Understand streaming UX implications
- **Performance Expectations**: Set realistic speed targets
- **User Research**: Test different speeds with users

### For Educators
- **LLM Concepts**: Visualize how language models generate text
- **Streaming APIs**: Demonstrate real-time data processing
- **Performance Metrics**: Show relationship between speed and user experience

## 🛠️ Technical Details

### Architecture
- **Vanilla JavaScript**: No frameworks, pure ES6+ JavaScript
- **Canvas Rendering**: Hardware-accelerated particle system
- **CSS Variables**: Dynamic theming and responsive design

### Performance Features
- **Particle Capping**: Limits particles to maintain 60fps
- **Efficient Rendering**: RequestAnimationFrame with delta time
- **Memory Management**: Automatic particle cleanup
- **Responsive Canvas**: DPI-aware rendering

## 🎨 Customization

### Color Scheme
Edit CSS variables in `styles.css`:
```css
:root {
  --accent: #06b6d4;      /* Primary accent color */
  --accent-2: #8b5cf6;    /* Secondary accent */
  --bg: #0a0c0f;          /* Background color */
  /* ... more variables */
}
```

### Speed Limits
Modify in `script.js`:
```javascript
const MAX_SPEED = 200;  // Maximum tokens per second
const DEFAULT_SPEED = 5; // Default startup speed
```

### Sample Text
Replace the `sampleText` variable in `script.js` with your own content.

## 📊 Statistics Explained

| Metric | Description |
|--------|-------------|
| **Tokens per second** | Current generation speed setting |
| **Time elapsed** | Total runtime since last reset |
| **Words generated** | Approximate word count (tokens ÷ 1.2) |
| **Tokens generated** | Exact number of tokens processed |

## 🤝 Contributing

Contributions welcome! Areas for improvement:
- Additional visualization modes
- More particle effects
- Sound effects
- Export functionality
- API integration examples

## 📝 License

MIT License - feel free to use in your projects!

---

**Made with ❤️ for the AI development community**

*Understanding token generation speed helps optimize timeouts and UX for LLM apps.*
