

const Button = ({onClickHandler, type, className, children, hover_effects_apply}) => {
  return (
    <>
    { type==="gradient" &&
        <div
        className={` ${className}
            group
            transition-all duration-300
            bg-gradient-to-r from-blue-600 to-purple-600 
            text-white font-semibold px-8 py-4 rounded-xl shadow-lg 

            ${hover_effects_apply===true?"hover:shadow-2xl hover:bg-gradient-to-l":""}
            
            w-fit h-fit

            inline-flex items-center justify-center
            font-[Inter]
        `}
        onClick={ onClickHandler? ()=>{onClickHandler()}: ()=>{} }
        >
            {children}
        </div>
    }
    </>
  )
}

export default Button
