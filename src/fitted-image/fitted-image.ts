import { Photo } from '../interfaces/photo-interface';
import { TokenObj } from '../interfaces/tokenObj-interface';
import { Component, OnInit, OnDestroy, Input, Output, EventEmitter } from '@angular/core';
import { Http,Headers, RequestOptions,ResponseContentType } from '@angular/http';
import { ViewController, Scroll } from 'ionic-angular';
import { Subject } from 'rxjs/Subject';
import {DomSanitizer} from '@angular/platform-browser';
import 'rxjs/Rx';

@Component({
  selector: 'fitted-image',
  templateUrl: './fitted-image.html',
  styleUrls: ['./fitted-image.scss'],
})
export class FittedImage implements OnInit, OnDestroy {

  @Input() photo: any;
  @Input() tokenObj: TokenObj; 
  @Input() resizeTriggerer: Subject<any>;
  @Input() wrapperWidth: number;
  @Input() wrapperHeight: number;

  @Output() onImageResized = new EventEmitter();

  private loading: boolean = true;
  private httpHeaders:Headers;

  private currentDimensions: any = {
    width: 0,
    height: 0,
  };

  private originalDimensions: any = {
    width: 0,
    height: 0,
  };

  private imageStyle: any = {};
  private resizeSubscription: any;

  private photoUrl:any;

  constructor(
    public http:Http,
    public sanitizer:DomSanitizer
  ) {
  }

  public ngOnInit() {
    // Listen to parent resize
    if (this.resizeTriggerer)
      this.resizeSubscription = this.resizeTriggerer.subscribe(event => {
        this.resize(event);
      });

    
    if (this.tokenObj) {
        
        this.httpHeaders = new Headers();        
        this.httpHeaders.set(this.tokenObj.header, this.tokenObj.token);   
    }
    
    this.getPhotoUrl();

  }

  public ngOnDestroy() {
    this.resizeSubscription.unsubscribe();
  }

  /**
   * Called every time the window gets resized
   */
  public resize(event) {
    // Save the image dimensions
    this.saveImageDimensions();
  }

    async _http_call(picUrl) {
        
        let response;        

        let requestOptionsProperties = {             
            method:'get',
            headers: this.httpHeaders,
            responseType: ResponseContentType.Blob,  
            url:picUrl                                      
        };

        try {                 

            let requestOptionsObj = new RequestOptions(requestOptionsProperties);       
            response = await this.http.request(picUrl,requestOptionsObj).toPromise();            

        }
        catch(res_error) {
            response = res_error;            
        }   

        return response;

    }

  getPhotoUrl() {
    
    if (this.tokenObj) {
    
        let urlCreator = window.URL;          
        this._http_call(this.photo.url).then((imgRes)=>{          
            this.photoUrl = this.sanitizer.bypassSecurityTrustUrl(urlCreator.createObjectURL(imgRes._body));
        });       
        
    }        
    else         
        this.photoUrl=this.photo.url;
    
  }

  /**
   * Get the real image dimensions and other useful stuff
   */
  private imageLoad(event) {
    // Save the original dimensions
    this.originalDimensions.width = event.target.width;
    this.originalDimensions.height = event.target.height;

    this.saveImageDimensions();

    // Mark as not loading anymore
    this.loading = false;
  }

  /**
   * Save the image dimensions (when it has the image)
   */
  private saveImageDimensions() {
    const width = this.originalDimensions.width;
    const height = this.originalDimensions.height;

    if (width / height > this.wrapperWidth / this.wrapperHeight) {
      this.currentDimensions.width = this.wrapperWidth;
      this.currentDimensions.height = height / width * this.wrapperWidth;
    } else {
      this.currentDimensions.height = this.wrapperHeight;
      this.currentDimensions.width = width / height * this.wrapperHeight;
    }

    this.imageStyle.width = `${this.currentDimensions.width}px`;
    this.imageStyle.height = `${this.currentDimensions.height}px`;

    this.onImageResized.emit({
      width: this.currentDimensions.width,
      height: this.currentDimensions.height,
      originalWidth: this.originalDimensions.width,
      originalHeight: this.originalDimensions.height,
    });
  }
}
