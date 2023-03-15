import { Injectable } from '@angular/core';

/**
 * This service only contains variables that will be shared with other services.
 */
@Injectable({
  providedIn: 'root'
})
export class SharedService {
  /*
  URLS:
    test: "http://localhost:3064"
    fcul: "http://appserver.alunos.di.fc.ul.pt:3064"
 */
  BACKEND_API = "http://localhost:3064"

  constructor() { }
}
