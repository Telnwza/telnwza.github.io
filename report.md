# Visual Learning Tools — Development Report

## ภาพรวมโครงการ

Visual Learning Tools เป็นเว็บไซต์แบบ Static สำหรับเรียนรู้หัวข้อ Computer Engineering ผ่านเครื่องมือแบบโต้ตอบ ทำงานด้วย HTML, CSS และ JavaScript โดยไม่ต้องมี backend และสามารถนำไปเผยแพร่บน GitHub Pages ได้

การพัฒนารอบนี้เปลี่ยนหน้า `Logic Gates Lab` จาก placeholder ให้เป็นเครื่องมือสร้างและวิเคราะห์วงจร Combinational Logic ที่ใช้งานได้จริง พร้อมเชื่อมโยงวงจร, Truth Table และสมการ Boolean เข้าด้วยกัน

## โครงสร้างโปรเจกต์ปัจจุบัน

```text
visual-learning/
├── index.html
├── css/
│   ├── style.css
│   └── simulator-shell.css
├── js/
│   ├── main.js
│   └── simulator-shell.js
├── automata/
│   └── index.html
├── vectors/
│   └── index.html
├── logic-gates/
│   ├── index.html
│   ├── style.css
│   ├── app.js
│   ├── logic-engine.js
│   └── logic-engine.test.js
├── scripts/
│   └── build-sites-worker.mjs
├── .openai/
│   └── hosting.json
├── README.md
└── report.md
```

## งานที่ทำในรอบนี้

### 0. Shared Focus-first Simulator UI

ปรับ Automata Studio, Vector Visualizer และ Logic Gates Lab ให้ใช้ interaction pattern เดียวกัน:

- รวม navigation และ simulator actions ให้เป็น compact top bar ชั้นเดียว
- Top bar ซ่อนอัตโนมัติเมื่อเริ่มทำงานบน canvas และกลับมาเมื่อเลื่อนเมาส์ไปขอบบน
- เลือกได้ระหว่าง Auto-hide และแสดง Top bar ตลอด โดยบันทึกค่าไว้ใน browser
- เพิ่ม Focus Mode เพื่อซ่อน panels และขยายพื้นที่จำลองเต็มหน้าจอ
- แยกปุ่มหลักออกจาก Import, Export, Clear และตัวอย่าง ซึ่งย้ายไปอยู่ในเมนูเพิ่มเติม
- พับ/เปิด Tools และ Analysis panel ได้ พร้อมจำสถานะของแต่ละ simulator
- บนจอเล็ก panels เปลี่ยนเป็น drawer เพื่อไม่ดัน canvas ลงด้านล่าง
- เพิ่มหน้าต่างวิธีใช้แบบสั้นแทน help box ที่แสดงค้างตลอดเวลา
- ใช้คีย์ลัดร่วมกัน: `[` เปิด/ปิด Tools, `]` เปิด/ปิด Analysis, `Shift+F` เปิด Focus Mode และ `?` เปิดวิธีใช้
- Logic Gates ต่อสายได้ทันทีโดยไม่ต้องเลือก Wire Mode และคลิกค่าบน Input ครั้งเดียวเพื่อสลับ 0/1
- Automata แสดง State/Transition inspector เฉพาะเมื่อเลือกวัตถุที่เกี่ยวข้อง
- Presets, gate ขั้นสูง และตัวเลือกการแสดงผลถูกพับด้วย progressive disclosure

การแก้ไขเพิ่มเติม: ขยายพื้นที่กดของ Logic Gate Input จากเฉพาะตัวเลขเป็นตัวอุปกรณ์ทั้งก้อน พร้อมแยก click ออกจาก drag เพื่อให้การลาก Input ไม่เปลี่ยนค่าโดยไม่ตั้งใจ ทดสอบการคลิกจริงกับ Half Adder แล้ว โดย `A=1, B=0` ให้ `Sum=1, Carry=0` และ `A=1, B=1` ให้ `Sum=0, Carry=1`

### 1. Circuit Builder

- สร้างพื้นที่วาดวงจรด้วย SVG
- เพิ่มอุปกรณ์โดยคลิกหรือ Drag and Drop จาก Component Library
- รองรับ Input, Output, Constant 0, Constant 1
- รองรับ AND, OR, NOT, NAND, NOR, XOR และ XNOR
- ปรับจำนวน input ของ gate ได้ตั้งแต่ 2–6 inputs
- ลากย้ายอุปกรณ์และเปิด/ปิด Snap to Grid ได้
- ต่อสายจาก output port ไป input port
- สายหนึ่งเส้นสามารถแตกออกไปหลายปลายทางได้
- ถ้าต่อสายใหม่เข้า input port เดิม ระบบจะแทนที่สายเดิม
- เลือกและลบ gate หรือสายได้
- Duplicate gate ได้
- เปลี่ยนชื่อ Input, Output และ Gate ได้

### 2. Live Simulation

- คำนวณค่าทุก gate แบบสดเมื่อเปลี่ยน Input
- คลิก Input เพื่อสลับค่า 0/1
- แสดงค่า 0, 1 หรือ X บน gate และสาย
- ใช้ X สำหรับค่าที่ไม่ทราบ เช่น input port ที่ยังไม่ได้ต่อ
- ใช้สีช่วยแยกสัญญาณ 0, 1 และ X โดยยังมีตัวเลขกำกับ
- เปิด/ปิดการแสดงค่าบนสายได้
- ตรวจ Combinational Loop และแสดงข้อผิดพลาด
- ตรวจสายหรือ input port ที่ยังต่อไม่สมบูรณ์

### 2.1 Seven-Segment Decoder Lab

- เพิ่มอุปกรณ์ `7-Segment Display` ใน Component Library
- มี input 7 ช่องเรียงและติดชื่อ `a, b, c, d, e, f, g` ตามมาตรฐาน
- Segment ติด/ดับแบบสดตามสัญญาณ Active-high จากวงจร
- แยกสถานะ 0, 1, X และขาที่ยังไม่ต่อด้วยสีและรูปแบบที่ต่างกัน
- 7-Segment เป็น output sink จึงไม่มี output port และไม่ถูกนับเป็น gate ที่ต้องต่อออก
- รองรับ Drag and Drop, Rename, Duplicate, Undo/Redo, Save/Load และ Export ภาพเหมือนอุปกรณ์อื่น
- เพิ่ม preset `7-Segment Tester` สำหรับทดลองเปิดแต่ละ segment โดยตรง
- เพิ่ม preset `BCD Decoder Starter` ที่เตรียม input 4-bit D/C/B/A และจอไว้สำหรับสร้าง decoder

### 3. Circuit → Truth Table

- สร้าง Truth Table จากวงจรอัตโนมัติ
- รองรับหลาย Output ในวงจรเดียว
- รองรับสูงสุด 6 Inputs หรือ 64 แถว
- คลิกแถวใน Truth Table เพื่อส่งค่า Input ของแถวนั้นกลับไปยังวงจร
- เดินดูทีละแถวด้วยปุ่ม Previous/Next
- Highlight แถวที่กำลังจำลอง
- Export Truth Table เป็น CSV
- Copy Truth Table เป็น Markdown

### 4. Circuit → Boolean Expression

- ไล่โครงสร้างวงจรย้อนจาก Output เพื่อสร้างสมการ Boolean
- แสดงสมการของแต่ละ Output แยกจากกัน
- สร้าง Truth Table ของวงจรแล้วใช้ผลลัพธ์เพื่อย่อสมการ
- แสดงสมการแบบย่อในรูป SOP
- รองรับสัญลักษณ์ AND (`·`), OR (`+`), NOT (`¬`), XOR (`⊕`) และ XNOR (`⊙`)

### 5. Truth Table → Circuit

- กำหนดชื่อตัวแปรได้ 1–6 ตัว
- กำหนดชื่อ Output ได้
- กรอก Output โดยคลิกเพื่อวนค่า 0 → 1 → X
- รองรับ Don't Care (`X`)
- แสดง Canonical SOP
- แสดง Simplified SOP และ Simplified POS
- แสดงรายการ Minterm และ Don't Care
- สร้างวงจรจากสมการ SOP ที่ย่อแล้ว
- ใช้ XOR/XNOR gate โดยตรงเมื่อระบบตรวจพบรูปแบบมาตรฐานสองตัวแปร
- สร้าง NOT gate ร่วมกันเมื่อหลายพจน์ใช้ตัวแปรกลับค่าเดียวกัน
- แบ่ง OR gate เป็นหลายระดับอัตโนมัติเมื่อมีพจน์จำนวนมาก
- จัดตำแหน่งวงจรเบื้องต้นและ Fit ให้พอดีกับหน้าจอ

### 6. Boolean Equation Calculator

- รับสมการ Boolean จากผู้ใช้
- รองรับ AND ด้วย `·`, `&`, `*` หรือคำว่า `AND`
- รองรับ OR ด้วย `+`, `|` หรือคำว่า `OR`
- รองรับ NOT ด้วย `¬`, `!`, `~`, apostrophe (`'`) หรือคำว่า `NOT`
- รองรับ XOR ด้วย `⊕`, `^` หรือคำว่า `XOR`
- รองรับ XNOR ด้วย `⊙` หรือคำว่า `XNOR`
- รองรับวงเล็บและลำดับความสำคัญของ operator
- คำนวณ Truth Table จากสมการ
- ย่อเป็น SOP/POS
- สร้างวงจรจากผลลัพธ์ของสมการได้

ตัวอย่างสมการที่รองรับ:

```text
(A · ¬B) + (¬A · B)
A' * B + A * B'
(A XOR B) AND C
NOT A OR B
```

### 7. Preset Circuits

เพิ่มวงจรตัวอย่างสำหรับเริ่มเรียนรู้ทันที:

- Half Adder
- Full Adder
- 2:1 Multiplexer
- 3-input Majority Vote

### 8. Quality-of-Life Functions

- Undo/Redo สูงสุด 100 สถานะ
- Autosave ลง `localStorage`
- Restore งานล่าสุดเมื่อเปิดหน้าใหม่
- Save ลง browser ด้วยตนเอง
- Import/Export โปรเจกต์เป็น JSON
- Export ภาพวงจรเป็น SVG
- Export ภาพวงจรเป็น PNG
- Zoom In/Out ด้วยปุ่มหรือล้อเมาส์
- Pan ด้วย Space + Drag หรือ Middle Mouse
- Fit Circuit to Screen
- Snap to Grid
- Keyboard shortcuts
- ตั้งชื่อโปรเจกต์ก่อน Export
- แสดงสถานะการบันทึกและข้อความแจ้งเตือนแบบ Toast
- Responsive layout สำหรับจอแคบ

## รูปแบบข้อมูลโปรเจกต์

ไฟล์ JSON ใช้ `schemaVersion` เพื่อเปิดทางให้ migration ในอนาคต:

```json
{
  "schemaVersion": 1,
  "name": "Half Adder",
  "nodes": [
    {
      "id": "node_1",
      "type": "INPUT",
      "label": "A",
      "x": 100,
      "y": 190,
      "value": 0,
      "inputCount": 0
    }
  ],
  "wires": [
    {
      "id": "wire_1",
      "from": { "node": "node_1", "port": "out" },
      "to": { "node": "node_2", "port": "in0" }
    }
  ]
}
```

## สถาปัตยกรรม

### `logic-engine.js`

ส่วนคำนวณที่ไม่ผูกกับ DOM เพื่อให้ทดสอบแยกได้ ประกอบด้วย:

- Three-valued gate evaluation: 0, 1 และ unknown
- Circuit graph evaluation
- Circuit validation และ cycle detection
- Circuit expression generation
- Circuit truth-table generation
- Boolean expression tokenizer/parser/evaluator
- Quine–McCluskey minimization
- Prime implicant selection
- SOP/POS และ canonical form generation

ไฟล์นี้ export ได้ทั้งแบบ Browser global (`window.LogicEngine`) และ CommonJS สำหรับ Node.js tests

### `app.js`

จัดการ UI และ interaction ได้แก่:

- Project state และ history
- SVG rendering
- Drag, Drop, Wire, Zoom และ Pan
- Autosave และ Import/Export
- Truth Table UI
- Equation calculator UI
- Circuit synthesis และ auto-layout
- Presets และ keyboard shortcuts

### `style.css`

กำหนด layout สามส่วน ได้แก่ Component Library, Circuit Canvas และ Analysis Panel โดยใช้ visual language เดียวกับ dashboard เดิม รวมถึง responsive rules สำหรับ tablet และ mobile

## Algorithm ที่ใช้ย่อสมการ

ระบบใช้แนวทาง Quine–McCluskey:

1. แปลงแถวที่ Output เป็น 1 และ Don't Care เป็น bit patterns
2. รวมพจน์ที่ต่างกันหนึ่ง bit
3. หา Prime Implicants
4. หา Essential Prime Implicants
5. เลือก cover ที่ใช้จำนวนพจน์และ literal ต่ำ
6. แปลงผลเป็น SOP
7. ทำกระบวนการเดียวกันกับแถว Output = 0 เพื่อสร้าง POS

ระบบจำกัดไว้ที่ 6 ตัวแปรเพื่อควบคุมจำนวนแถวและเวลาในการคำนวณให้เหมาะกับการใช้งานใน browser

## การอัปเดต Dashboard

- เปลี่ยนสถานะ Logic Gates Lab จาก `coming soon` เป็น `available`
- เพิ่ม Logic Gates Lab ใน Recently Added
- ปรับคำอธิบายและ tags ให้ครอบคลุม Boolean Algebra และ circuit synthesis

## การเผยแพร่

โครงสร้าง Static และ relative paths สำหรับ GitHub Pages ยังคงทำงานเหมือนเดิม และเพิ่ม build script แยกต่างหากสำหรับรวมไฟล์เว็บชุดเดียวกันเป็น self-contained worker สำหรับ OpenAI Sites โดยไม่เปลี่ยน source pages หรือบังคับให้ workflow เดิมต้องใช้ package manager

## การทดสอบ

เพิ่ม automated tests ที่ `logic-gates/logic-engine.test.js` และรันด้วย:

```sh
node --test logic-gates/logic-engine.test.js
```

กรณีที่ทดสอบ:

1. การจำลอง Half Adder
2. การสร้าง Half Adder Truth Table
3. การตรวจจับและย่อ XOR
4. การย่อสมการที่มี Don't Care
5. การ parse สมการหลายรูปแบบ
6. การประเมินสมการและสร้าง Truth Table
7. การตรวจ Combinational Loop

นอกจากนี้ได้ทำ randomized equivalence check กับฟังก์ชัน 1–4 ตัวแปร โดยเปรียบเทียบค่าจากสมการที่ย่อแล้วกับ Truth Table ต้นฉบับ รวมถึงกรณีที่มี Don't Care

การตรวจเชิง Static ที่ทำ:

- ตรวจ syntax ของ `logic-engine.js`
- ตรวจ syntax ของ `app.js`
- ตรวจว่า DOM ID ทุกตัวที่ JavaScript อ้างถึงมีอยู่จริงใน HTML
- ตรวจ relative paths เพื่อให้ทำงานบน GitHub Pages project URL

## วิธีใช้งาน

เปิดไฟล์ `index.html` โดยตรง หรือรัน static server:

```sh
python3 -m http.server 8000
```

แล้วเปิด:

```text
http://localhost:8000/logic-gates/
```

ขั้นตอนพื้นฐาน:

1. ลาก Input, Gate และ Output ลง Canvas
2. ลากจาก output port ด้านขวาไป input port ด้านซ้าย
3. ดับเบิลคลิก Input เพื่อสลับค่า
4. ดูค่า Output, สาย และสมการในแท็บวิเคราะห์
5. กดสร้าง Truth Table แล้วคลิกแต่ละแถวเพื่อทดลองกับวงจร

## ข้อจำกัดปัจจุบัน

- รองรับเฉพาะ Combinational Logic ยังไม่มี Clock, Flip-Flop, Register หรือ Sequential Simulation
- Truth Table และการย่อสมการจำกัดสูงสุด 6 inputs
- Auto-layout เน้นวงจรที่สร้างจาก Truth Table; วงจรที่ผู้ใช้สร้างเองยังไม่มีปุ่มจัดเรียงอัตโนมัติเต็มรูปแบบ
- การเดินสายใช้เส้นโค้งและยังไม่มี obstacle-avoiding auto-router
- ยังไม่มี multi-select, group และ custom reusable component
- งานถูกเก็บใน browser เครื่องปัจจุบันเท่านั้น เนื่องจากไม่มี backend
- ลิงก์ GitHub ใน navigation ยังเป็น placeholder `https://github.com/`

## แนวทางพัฒนาต่อ

1. เพิ่ม K-map แบบ interactive และ highlight กลุ่มที่ใช้ย่อสมการ
2. เพิ่ม multi-select, align และ distribute
3. เพิ่ม custom component/subcircuit
4. เพิ่ม NAND-only และ NOR-only synthesis
5. เพิ่ม Verilog/VHDL export
6. เพิ่ม challenge mode และ circuit equivalence checker สำหรับการบ้าน
7. เพิ่ม sequential circuit simulator เป็น visualizer แยกหรือ advanced mode
