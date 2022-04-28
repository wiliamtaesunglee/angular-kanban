import { Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import * as Firestore from '@firebase/firestore'
import { switchMap } from 'rxjs';
import { Board } from './board.model';

@Injectable({
  providedIn: 'root'
})
export class BoardService {

  constructor(private afAuth: AngularFireAuth, private db: AngularFirestore) {}
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
  updateTasks(boardId: string, tasks: Task[]) {
    return this.db
      .collection('boards')
      .doc(boardId)
      .update({ tasks });
  }

  /**
   * Remove a specific task from the board
   */
  removeTask(boardId: string, task: Task) {
    return this.db
      .collection('boards')
      .doc(boardId)
      .update({
        tasks: Firestore.arrayRemove(task)
      });
  }

  /**
   * Get all boards owned by current user
   */
  getUserBoards() {
    return this.afAuth.authState.pipe(
      switchMap(user => {
        if (user) {
          return this.db
            .collection<Board>('boards', ref => ref.where('uid', '==', user.uid).orderBy('priority'))
            .valueChanges({ idField: 'id' })
        } else {
          return [];
        }
      })
    )
  }

  /**
   * Run batch write to change the priority of each board for sorting
   */
  // sortBoards(boards: Bord[]) {
  //   const batch = Firestore.writeBatch;
  //   const refs = boards.map(b => batch.collection('boards').doc(b.id));
  //   refs.forEach((ref, idx) => batch.update(ref, { priority: idx }));
  //   batch.commit();
  // }
}
