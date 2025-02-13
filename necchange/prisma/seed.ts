import { Prisma, PrismaClient } from '@prisma/client'
import schedule from '../public/data/input/schedule.json'
import * as alocationJson from '../public/data/input/alocation.json';

type AlocationEntry = {
  uc: string;
  year: string;
  semester: string;
  type_class: string;
  shift: string;
  slots: (string | boolean)[][];
};
type Alocation = {
  [studentNr: string]: AlocationEntry[];
};
const alocation: Alocation = alocationJson;


interface id_uc{
  id: number;
}
const ucs_ids: {[id: string]: id_uc} = {}

function populate_ucs(){
  let ucs: Prisma.ucCreateInput[] = [];
  let ucs_names: Array<string> = [];
  let i = 1;
  schedule.map((class_schedule) => {
    if(!ucs_names.includes(class_schedule.uc)){
      ucs_names.push(class_schedule.uc);
      let uc = {
        id: i,
        name: class_schedule.uc,
        year: parseInt(class_schedule.year),
        semester: parseInt(class_schedule.semester)
      }
      ucs.push(uc);
      ucs_ids[class_schedule.uc] = {id: i};
      i++;
    }
  })
  return ucs;
} 

const weekdays: Record<string, number> = {};
weekdays['Segunda'] = 1;
weekdays['Terça'] = 2;
weekdays['Quarta'] = 3;
weekdays['Quinta'] = 4;
weekdays['Sexta'] = 5;

const type_class: Record<string, number> = {}
type_class['T'] = 1;
type_class['TP'] = 2;
type_class['PL'] = 3;

let classes: { 
  id: number;
  uc_id: number;
  weekday: number; 
  start_time: string; 
  end_time: string; 
  local: string; 
  type: number; 
  shift: number; 
}[] = [];
function populate_classes(){
  let i = 1;

  schedule.map((class_schedule) =>{
    class_schedule.slots.map((slot) =>{
      let class_to_add = {
        id: i,
        uc_id: ucs_ids[class_schedule.uc].id,
        weekday: weekdays[slot[0]],
        start_time: slot[1] + ":" + slot[2],
        end_time: slot[3] + ":" + slot[4],
        local: slot[5],
        type: type_class[class_schedule.type_class],
        shift: parseInt(class_schedule.shift)
      };
      classes.push(class_to_add);
      i++;
    })
  })

  return classes
}



let students: {
  id: number; 
  number: string; 
  firstname: string; 
  lastname: string; 
  email: string;
  //password: null
  is_admin: boolean;
}[] = [];
function populate_students(){
    let i = 1;

    Object.keys(alocation).map((student_nr) =>{
        let student = {
          id: i,
          number: student_nr,
          firstname: "John",
          lastname: "Doe",
          email: student_nr + "@alunos.uminho.pt",
          //password: null
          is_admin: false
        }
        students.push(student);
        i++;
    })

    return students;
}



function populate_student_class() {
  let students_classes: { 
    id: number; 
    student_id: number | undefined; 
    class_id: number | undefined; 
  }[] = [];
  let i=1;

  Object.keys(alocation).forEach((studentNr) => {
    let entries = alocation[studentNr]
    if(Array.isArray(entries)){
      entries.map((student_class) => {
        let student_id = students.filter((student) => student.number == studentNr).at(0)?.id;
        
        let uc_id = ucs_ids[student_class.uc].id;
        let type_class_int = type_class[student_class.type_class]
        let shift = parseInt(student_class.shift)
        student_class.slots.map((slot) =>{
          if(slot[0] != true && slot[0] != false){
            let weekday_int = weekdays[slot[0]]
            let start_time = slot[1] + ":" + slot[2]
            let end_time = slot[3] + ":" + slot[4]

            let class_id = classes.filter((class_check) => class_check.uc_id == uc_id 
                                                        && class_check.type == type_class_int
                                                        && class_check.shift == shift
                                                        && class_check.weekday == weekday_int
                                                        && class_check.start_time == start_time
                                                        && class_check.end_time == end_time
            ).at(0)?.id
            let student_class = {
              id: i,
              student_id: student_id,
              class_id: class_id
            }
            students_classes.push(student_class);
            i++;
          }
        })
      })
    }
  });
  return students_classes
}


const prisma = new PrismaClient()

async function main() {
  
    let ucs: Prisma.ucCreateInput[] = populate_ucs();
    let classes = populate_classes();
    let students = populate_students();
    let students_classes = populate_student_class()

    //nuclear_bomb()
    
    ucs.map(async (uc) => {
      await prisma.uc.create({
        data: uc
      })
    });

    students.map( async (student) => {
      await prisma.student.create({
        data: student
      })
    })

    classes.map(async (class_add) =>{
      await prisma.renamedclass.create({
        data: class_add
      })
    });
  
    students_classes.map( async (student_class) => {
      await prisma.student_class.create({
        data: student_class
      })
    });
    
   
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })



async function nuclear_bomb(){
  await prisma.student_class.deleteMany()
  await prisma.renamedclass.deleteMany();
  await prisma.student.deleteMany();
  await prisma.uc.deleteMany();
}