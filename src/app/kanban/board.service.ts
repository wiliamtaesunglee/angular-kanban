import { Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { 
  getFirestore, 
  writeBatch, 
  doc, 
  arrayRemove, 
  collection, 
  where, 
  query,
  getDocs,
  setDoc,
  onSnapshot
} from '@firebase/firestore'
import { initializeApp } from 'firebase/app';
import { environment } from 'src/environments/environment';
import { Board } from './board.model';

const firebaseApp = initializeApp(environment.firebase);
const firestore = getFirestore(firebaseApp);
const batch = writeBatch(firestore);
const collectionRef = collection(firestore, 'boards');

@Injectable({
  providedIn: 'root'
})
export class BoardService {
  constructor(private afAuth: AngularFireAuth, private db: AngularFirestore) {}
  
  getUser() {
    return this.afAuth.currentUser;
  }

  /**
   * Creates a new board for the current user
   */
  async createBoard(data: Board) {
    const user = await this.afAuth.currentUser;
    return this.db.collection('boards').add({
      ...data,
      uid: user?.uid,
      tasks: [{ description: 'Hello!', label: 'yellow' }]
    });
  }

  /**
   * Delete boardP
   */
  deleteBoard(boardId: string) {
    return this.db
      .collection('boards')
      .doc(boardId)
      .delete();
  }

  /**
   * Updates the tasks on board
   */
  async updateTasks(boardId: string, tasks: Task[]) {
    console.log('first step', boardId);
    const documentRef = doc(firestore, 'boards', boardId)
    console.warn('step 2', boardId);
    return await setDoc(documentRef,
      {
        tasks: tasks,
      },
      { merge: true }
    )
      .then(() => {
        console.log("Updated/merged!");
      })
      .catch((error) => {
        console.error("deu erro",error);
      });

    // return await this.db
    //   .collection('boards')
    //   .doc(boardId)
    //   .update({ tasks });
  }

  /**
   * Remove a specific task from the board
   */
  async removeTask(boardId: string, task: Task) {
    return this.db
      .collection('boards')
      .doc(boardId)
      .update({
        tasks: arrayRemove(task)
      });
  }

  /**
   * Get all boards owned by current user
   */
  async getUserBoards() {
    const boardsList: any[] = [];
    const userData = await this.afAuth.currentUser;
    const collectionQuery = query(
      collectionRef,
      where("uid", "==", userData?.uid),
    );
    // onSnapshot(collectionQuery, (querySnapshots) => {
    //   querySnapshots.forEach((eachDoc) => {
    //     console.log('eachDoc', eachDoc)
    //     boardsList.push({...eachDoc.data(), id: eachDoc.id});
    //   });
    // });
    const querySnapshot = await getDocs(collectionQuery);
    querySnapshot.forEach((eachDoc) => {
      const data = {...eachDoc.data(), id: eachDoc.id};
      boardsList.push(data)
    });
    console.log('boardList', boardsList);

    return boardsList.sort((a: any, b: any) => a.priority - b.priority);
  }

  /**
   * Run batch write to change the priority of each board for sorting
   */
  sortBoards(boards: Board[]) {
    const refs = boards.map(b => doc(collectionRef, b.id));
    refs.forEach((ref, idx) => batch.update(ref, { priority: idx }));
    batch.commit();
  }
}
