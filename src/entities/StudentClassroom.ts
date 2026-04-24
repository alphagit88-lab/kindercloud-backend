import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  Column,
  PrimaryColumn
} from "typeorm";
import { Student } from "./Student";
import { ClassRoom } from "./ClassRoom";

@Entity("student_classrooms")
export class StudentClassroom {
  @PrimaryColumn({ name: "student_id", type: "uuid" })
  studentId!: string;

  @PrimaryColumn({ name: "classroom_id", type: "uuid" })
  classRoomId!: string;

  @ManyToOne(() => Student, student => student.classRooms, { onDelete: "CASCADE" })
  @JoinColumn({ name: "student_id" })
  student!: Student;

  @ManyToOne(() => ClassRoom, classroom => classroom.students, { onDelete: "CASCADE" })
  @JoinColumn({ name: "classroom_id" })
  classRoom!: ClassRoom;
}
