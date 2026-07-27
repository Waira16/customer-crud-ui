import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { Commitment } from '../models/commitment';
import { environment } from '../../environments/environment';

export interface CommitmentTerminationResult {
  penaltyAmount: number;
  remainingMonths: number;
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class CommitmentService {

  private readonly apiUrl = `${environment.apiBaseUrl}/api/commitments`;

  constructor(private http: HttpClient) {}

  getCommitment(customerId: number): Observable<Commitment> {
    return this.http.get<Commitment>(`${this.apiUrl}/${customerId}`);
  }

  previewTermination(customerId: number): Observable<CommitmentTerminationResult> {
    return this.http.get<CommitmentTerminationResult>(
      `${environment.apiBaseUrl}/api/customers/${customerId}/commitment/termination-preview`
    );
  }

  terminateCommitment(customerId: number): Observable<CommitmentTerminationResult> {
    return this.http.put<CommitmentTerminationResult>(
      `${this.apiUrl}/${customerId}/terminate`,
      {}
    );
  }
}
