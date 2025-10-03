if(document.getElementsByClassName('menu-btn')[0]){
    document.getElementsByClassName('menu-btn')[0].addEventListener('click',()=>{
        document.getElementsByClassName('menu-btn')[0].classList.toggle('active');
        
        document.getElementsByClassName('small-menu')[0].classList.toggle('mobile-menu-active');
        console.log("clicked");
    });
}