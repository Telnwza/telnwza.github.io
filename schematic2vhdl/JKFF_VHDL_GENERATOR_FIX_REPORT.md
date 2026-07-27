# รายงานการแก้บัค VHDL Generator สำหรับ Flip-Flop ที่ต่อค่าคงที่

วันที่: 27 กรกฎาคม 2026
ส่วนที่แก้ไข: Schematic Studio → VHDL Generator

## สรุปผล

แก้บัคที่ทำให้ Vivado สังเคราะห์ VHDL ของ JK flip-flop ไม่ผ่าน เมื่อขา J หรือ K ต่อกับ VCC/GND โดยตรง บัคเดิมสร้างนิพจน์เปรียบเทียบ literal กับ literal เช่น `'1'='0'` ซึ่งไม่มีบริบทเพียงพอให้ Vivado เลือก overload ของ operator `=` ได้ จึงเกิด error `[Synth 8-9493]` หลายรายการจากต้นเหตุเดียวกัน

หลังแก้ไข generator จะตรวจค่าคงที่ก่อนสร้าง VHDL และสร้างพฤติกรรม `hold`, `reset`, `set` หรือ `toggle` โดยตรง ไม่สร้างการเปรียบเทียบ literal ที่กำกวมอีก

## อาการก่อนแก้ไข

วงจร JK-FF ที่ต่อ `J=1` และ `K=1` จาก VCC ถูกสร้างเป็น VHDL ดังนี้:

```vhdl
if    ('1'='0' and '1'='1') then ...
elsif ('1'='1' and '1'='0') then ...
elsif ('1'='1' and '1'='1') then ...
end if;
```

Vivado รายงาน:

```text
ERROR: [Synth 8-9493] found '3' definitions of operator "=",
cannot determine exact overloaded matching definition for "="
```

ข้อความ error ถูกแสดงซ้ำหลายครั้ง เพราะแต่ละนิพจน์มี operator `=` หลายตำแหน่ง แต่ทั้งหมดเกิดจากสาเหตุเดียวกัน

## สาเหตุทางเทคนิค

ใน VHDL ค่า `'0'` และ `'1'` เป็น character literal ที่ยังไม่มีชนิดแน่นอนจนกว่าจะได้รับบริบท เมื่อทั้งสองฝั่งของ `=` เป็น literal เช่น `'1'='0'` ตัว compiler ไม่สามารถสรุปได้ว่าต้องใช้ equality ของ `BIT`, `STD_LOGIC` หรือชนิด enumeration อื่น

กรณีปกติ เช่น `j='1'` ไม่มีปัญหา เพราะชนิด `STD_LOGIC` ของสัญญาณ `j` ช่วยกำหนด overload ที่ถูกต้อง

## วิธีแก้ไข

เพิ่ม helper สำหรับสร้าง sequential VHDL อย่างปลอดภัยใน `schematic2vhdl/index.html`:

- `stdLogicLiteralBit()` ตรวจว่า driver เป็นค่าคงที่ `'0'` หรือ `'1'`
- `stdLogicEquals()` คืนค่า `true`/`false` เมื่อ operand เป็นค่าคงที่ และสร้าง equality เฉพาะเมื่อ operand เป็นสัญญาณที่มีชนิดแล้ว
- `jkSequentialBody()` สร้างพฤติกรรม JK-FF ตามค่า J/K
- `tSequentialBody()` ป้องกันปัญหาเดียวกันใน T-FF
- `srSequentialBody()` ป้องกันปัญหาเดียวกันใน SR-FF

ตารางการสร้างโค้ดสำหรับ JK-FF เมื่อ J/K เป็นค่าคงที่:

| J | K | พฤติกรรมที่สร้าง |
|---|---|---|
| 0 | 0 | Hold (`null;`) |
| 0 | 1 | Reset Q=0, QN=1 |
| 1 | 0 | Set Q=1, QN=0 |
| 1 | 1 | Toggle Q |

ตัวอย่างผลลัพธ์ใหม่สำหรับ `J=K=1`:

```vhdl
elsif rising_edge(clock_in) then
  n1_q  <= not n1_q;
  n1_qn <= n1_q;
end if;
```

โค้ดใหม่นี้มีความหมายเท่ากับวงจรเดิม แต่ไม่มี equality ที่กำกวมและมีขนาดเล็กลง

กรณี J/K มาจาก INPUT หรือ net ปกติ generator ยังคงสร้างเงื่อนไข JK ครบถ้วน เช่น `j='0'` และ `k='1'` ซึ่งมีชนิดชัดเจนและ Vivado สังเคราะห์ได้

## ขอบเขตการแก้ไขเพิ่มเติม

แม้ error ที่พบเกิดกับ JK-FF แต่รูปแบบเดียวกันมีอยู่ใน T-FF และ SR-FF เมื่อขาควบคุมต่อ VCC/GND จึงปรับทั้งสามชนิดพร้อมกันเพื่อไม่ให้บัคเดิมเกิดซ้ำกับ component อื่น

ไม่มีการเปลี่ยนพฤติกรรมของ D-FF, combinational gates, sub-schematic หรือรูปแบบไฟล์โปรเจกต์

## การทดสอบ

เพิ่มไฟล์ `schematic2vhdl/vhdl-generator.test.js` และตรวจสอบกรณีต่อไปนี้:

1. JK-FF ที่ `J=K=1` สร้าง toggle โดยตรงและไม่มี `'1'='0'`
2. JK-FF ค่าคงที่ครบทั้ง 4 combinations ให้ผล hold/reset/set/toggle ถูกต้อง
3. กรณีผสมระหว่างสัญญาณกับค่าคงที่ยังสร้าง equality ที่มีชนิดชัดเจน
4. T-FF และ SR-FF ที่ต่อค่าคงที่ไม่สร้าง literal-to-literal equality

ผลทดสอบ:

```text
VHDL generator regression tests: 4/4 ผ่าน
Existing project tests:          40/40 ผ่าน
รวม:                             44/44 ผ่าน
```

นอกจากนี้ตรวจ `git diff --check` แล้วไม่พบ whitespace หรือ patch-format error

## ไฟล์ที่เปลี่ยน

- `schematic2vhdl/index.html` — เพิ่ม constant folding และเปลี่ยน sequential code emission
- `schematic2vhdl/vhdl-generator.test.js` — regression tests สำหรับบัคนี้
- `schematic2vhdl/JKFF_VHDL_GENERATOR_FIX_REPORT.md` — รายงานฉบับนี้

## สิ่งที่ไม่ใช่ส่วนหนึ่งของบัคนี้

การแก้ครั้งนี้แก้ error ตอน compile `[Synth 8-9493]` โดยตรง แต่ไม่ใช่การแก้ประเด็นต่อไปนี้:

- Flip-flop ที่ไม่มี reset/initial state อาจเริ่มเป็น `U` ใน simulation
- การนำ Q/QN ไปเป็น clock ของ FF ตัวถัดไปเป็น ripple/generated clock ซึ่งอาจมีข้อจำกัดด้าน clock routing และ timing บน FPGA
- ต้อง pulse reset จริงใน testbench หรือบน hardware หากวงจรใช้ reset

ประเด็นเหล่านี้เป็นข้อจำกัดของ sequential design คนละส่วนกับ operator-overload error และควรตรวจแยกหลัง VHDL ผ่านการสังเคราะห์แล้ว

## วิธีตรวจรับ

1. เปิด schematic ที่มี JK-FF และต่อ J/K กับ VCC
2. Generate VHDL ใหม่
3. ตรวจว่า process ของ JK-FF เป็น direct toggle และไม่มีนิพจน์ `'1'='0'`
4. นำไฟล์ใหม่เข้า Vivado และรัน Synthesis
5. หลัง Synthesis ผ่าน จึงตรวจ reset, waveform และ clock-routing warning ต่อ
