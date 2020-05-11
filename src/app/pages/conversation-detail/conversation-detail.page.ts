import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-conversation-detail',
  templateUrl: './conversation-detail.page.html',
  styleUrls: ['./conversation-detail.page.scss'],
})
export class ConversationDetailPage implements OnInit {
  IDConv = null;
  constructor(
    private activatedRoute: ActivatedRoute
  ) { }

  ngOnInit() {
    this.IDConv = this.activatedRoute.snapshot.paramMap.get('IDConv');
  }

}
