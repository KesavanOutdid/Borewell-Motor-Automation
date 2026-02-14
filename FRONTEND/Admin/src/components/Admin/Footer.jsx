import React from 'react'
import { Link } from 'react-router-dom';

function Footer() {
  const year = new Date();
  return (
    <footer className="footer pt-3  ">
       <div className="container-fluid">
            <div className="row align-items-center justify-content-lg-between">
                <div className="col-lg-6 mb-lg-0 mb-4">
                    <div className="copyright text-center text-sm text-muted text-lg-start">
                        Copyright &copy; {year.getFullYear()} made with <i className="fa fa-heart"></i> by
                            <Link to="https://outdidunified.com" className="font-weight-bold" target="_blank"> Outdid Unified Pvt Ltd,. </Link>
                        for a better web. 
                    </div>
                </div>
                {/* <div className="col-lg-6">
                    <ul className="nav nav-footer justify-content-center justify-content-lg-end">
                        <li className="nav-item">
                            <Link href="https://www.creative-tim.com" className="nav-link text-muted" target="_blank">Creative Tim</Link>
                        </li>
                        <li className="nav-item">
                            <Link href="https://www.creative-tim.com/presentation" className="nav-link text-muted" target="_blank">About Us</Link>
                        </li>
                        <li className="nav-item">
                            <Link href="https://creative-tim.com/blog" className="nav-link text-muted" target="_blank">Blog</Link>
                        </li>
                        <li className="nav-item">
                            <Link href="https://www.creative-tim.com/license" className="nav-link pe-0 text-muted" target="_blank">License</Link>
                        </li>
                    </ul>
                </div> */}
            </div>
        </div>
    </footer> 
  );
};
export default Footer
