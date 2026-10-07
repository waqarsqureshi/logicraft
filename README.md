# LogiCraft 

A powerful, interactive **digital logic circuit simulator** built with React and TypeScript. Design, simulate, and analyze digital circuits with an intuitive canvas interface, comprehensive component library, and advanced analysis tools.

## Features

###  Interactive Circuit Design
- **Drag-and-drop canvas** with intuitive component placement
- **Real-time waveform visualization** for circuit analysis
- **Auto-pulldown** option for unconnected gate inputs
- **Undo/Redo** support for easy circuit modifications
- **Theme toggle** (dark/light mode)

###  Comprehensive Component Library
- **Basic Gates**: AND, OR, NOT, NAND, NOR, XOR, XNOR
- **Input Components**: Toggle switches, clock generators
- **Output Components**: LEDs, displays
- **Sequential Logic**: Latches, flip-flops
- **Multiplexers & Decoders**: Data routing components
- **Arithmetic Circuits**: Adders, arithmetic logic units
- **Measurement Tools**: Digital multimeter, timing analyzer/oscilloscope
- **Transistor Models**: CMOS transistor visualization

###  Advanced Analysis Tools
- **Truth Table Generator**: Automatic truth table computation for combinational circuits
- **Timing Diagram Analyzer**: Waveform visualization and timing analysis
- **Digital Multimeter**: DC voltage and logic state measurement
- **Oscilloscope**: Real-time waveform capture and display
- **Error Detection**: Built-in error feedback for circuit issues

###  Educational Features
- **Interactive Tutorials**: Step-by-step lessons from transistors to complex circuits
- **Circuit Templates**: Pre-built templates for learning different circuit types
- **Difficulty Levels**: Beginner, Intermediate, and Advanced tutorials
- **Inside Gate Modal**: Explore transistor-level internals of logic gates
- **Project Manager**: Save, load, and organize circuit projects

###  Import/Export & Sharing
- **JSON Export**: Save circuit designs as portable JSON files
- **Shareable URLs**: Generate shareable links for circuit designs (URL hash encoding)
- **File Upload**: Import previously saved circuit files
- **Project Slots**: Local storage-based project management

## Quick Start

### Prerequisites
- Node.js (v18 or higher recommended)
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/waqarsqureshi/logicraft.git
cd logicraft

# Install dependencies
npm install

# Start development server
npm run dev
```

The application will start on `http://localhost:3000` (configurable port).

### Build for Production

```bash
# Create optimized build
npm run build

# Preview production build locally
npm run preview
```

## Usage

### Creating a Circuit
1. **Open the Component Palette** - Access the sidebar to browse available components
2. **Add Components** - Click or drag components onto the canvas
3. **Connect Components** - Draw wires between pins to create connections
4. **Simulate** - Watch your circuit in action in real-time

### Analyzing Circuits
1. **Truth Table** - Generate automatic truth tables for combinational logic
2. **Timing Diagram** - Visualize signal timing and behavior over time
3. **Multimeter** - Probe circuit nodes to measure voltage and logic state
4. **Transistor View** - Inspect transistor switching behavior inside gates

### Managing Projects
- **Save Projects** - Store circuits in browser local storage
- **Export/Import** - Share circuits via JSON files or shareable URLs
- **Use Templates** - Start with pre-built circuit templates

## Project Structure

```
src/
├── components/          # React UI components
│   ├── canvas/         # Circuit canvas and drawing
│   ├── palette/        # Component library palette
│   ├── toolbar/        # Top navigation bar
│   ├── analyzer/       # Analysis tools (truth table, timing diagram)
│   ├── transistor/     # Transistor visualization
│   ├── modals/         # Project and export modals
│   └── tutorials/      # Tutorial interface
├── engine/             # Circuit simulation engine
│   ├── definitions.ts  # Component definitions
│   ├── simulation.ts   # Core simulation logic
│   └── transistorModels.ts  # Transistor physics
├── types/              # TypeScript type definitions
├── data/               # Static data
│   ├── templates.ts    # Circuit templates
│   ├── tutorials.ts    # Tutorial lessons
│   ├── combinationalCircuits.ts  # Benchmark circuits
│   └── advancedCircuits.ts  # Complex circuit examples
├── utils/              # Utility functions
│   ├── storage.ts      # Project persistence
│   ├── audio.ts        # Sound effects
│   └── geometry.ts     # Canvas geometry
└── App.tsx            # Main application component
```

## Technologies

- **Frontend Framework**: React 19
- **Language**: TypeScript 7
- **Build Tool**: Vite
- **Styling**: Tailwind CSS 4
- **UI Components**: Lucide React icons
- **Animations**: Motion

## Development

### Available Scripts

```bash
npm run dev      # Start development server with hot reload
npm run build    # Build for production
npm run preview  # Preview production build
npm run clean    # Remove build artifacts
npm run lint     # Run TypeScript type checking
```

### Environment Variables

Create a `.env` file for optional configuration:
```env
VITE_API_KEY=your_google_genai_key
```

## Features Roadmap

- [ ] Collaborative circuit editing
- [ ] Advanced IC design tools
- [ ] Circuit optimization algorithms
- [ ] Extended component library
- [ ] Mobile app version

## Contributing

Contributions are welcome! Please feel free to submit pull requests or open issues for bugs and feature requests.

## License

This project is open source. See LICENSE file for details.

## Educational Use

LogiCraft is designed for educational purposes and is actively used in computer science curricula. It bridges the gap between theoretical digital logic and practical circuit design, making it an excellent tool for:
- University-level digital logic courses
- Computer architecture education
- Electronics hobbyists
- Self-paced learning

## Support

For issues, questions, or suggestions, please open an issue on GitHub or contact waqar.shahid@gmail.com

---

**Built for CT101 - Computing Systems**
